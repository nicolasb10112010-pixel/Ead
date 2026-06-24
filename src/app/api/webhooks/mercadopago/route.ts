import { NextResponse } from "next/server";
import { getPayment } from "@/lib/gateways/mercadopago";
import { createAdminClient } from "@/lib/supabase/server";
import { processPayment } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Webhook do Mercado Pago.
 *
 * SEGURANÇA / CONFIABILIDADE:
 *  - NÃO confiamos no corpo da notificação para o status. Apenas pegamos o
 *    id do pagamento e CONSULTAMOS a API do MP (fonte autoritativa).
 *  - Idempotência: gravamos o evento em payment_events com unique
 *    (provider, provider_event_id). Reentregas do MP não creditam duas vezes.
 *  - Crédito é concedido pela service role (ignora RLS) só aqui no servidor.
 *
 * Observação: para receber notificações o app precisa estar em uma URL
 * pública (deploy/ngrok). Em localhost o MP não consegue chamar este endpoint.
 */
export async function POST(req: Request) {
  // 1. Descobre o id do pagamento (suporta formato webhook e IPN).
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);

  const type =
    (body as { type?: string; topic?: string }).type ??
    url.searchParams.get("type") ??
    url.searchParams.get("topic");

  const paymentId =
    (body as { data?: { id?: string } }).data?.id ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id");

  // Só tratamos eventos de pagamento.
  if (type && type !== "payment") {
    return NextResponse.json({ ignored: true });
  }
  if (!paymentId) {
    return NextResponse.json({ ignored: "sem id" });
  }

  // 2. Consulta o pagamento na API do MP (fonte autoritativa do status).
  const payment = await getPayment(String(paymentId));
  if (!payment) {
    // Não encontrado agora → peça retry ao MP.
    return NextResponse.json({ error: "pagamento não encontrado" }, { status: 404 });
  }

  // 3. Processa de forma idempotente (mesmo helper da API de pagamento).
  const admin = createAdminClient();
  const result = await processPayment(admin, payment);
  return NextResponse.json(result);
}

// MP às vezes faz GET de verificação.
export async function GET() {
  return NextResponse.json({ ok: true });
}
