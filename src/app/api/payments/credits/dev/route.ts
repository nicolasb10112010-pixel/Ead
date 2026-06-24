import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { processPayment } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * SIMULAÇÃO DE PAGAMENTO (apenas DEV).
 * Só funciona quando NÃO há Public Key do MP configurada E fora de produção.
 * Serve para testar o fluxo completo (incluindo crédito idempotente) sem
 * precisar das credenciais reais. Em produção, retorna 403.
 */
export async function POST(req: Request) {
  const hasPublicKey = !!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  const isProd = process.env.NODE_ENV === "production";
  if (hasPublicKey || isProd) {
    return NextResponse.json(
      { error: "Simulação desabilitada (use o pagamento real)." },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const orderId = body?.orderId as string | undefined;
  const outcome = (body?.outcome as string | undefined) ?? "approved";
  if (!orderId) return NextResponse.json({ error: "orderId ausente." }, { status: 400 });

  // Confere que o pedido é do usuário.
  const { data: order } = await supabase
    .from("orders")
    .select("id, amount_cents, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  const admin = createAdminClient();

  // Pagamento simulado — id estável por pedido p/ garantir idempotência.
  const result = await processPayment(admin, {
    id: `dev-${orderId}`,
    status: outcome === "approved" ? "approved" : outcome,
    statusDetail: "dev_simulation",
    externalReference: orderId,
    amountCents: order.amount_cents,
  });

  if (outcome !== "approved") {
    await admin.from("orders").update({ status: "failed" }).eq("id", orderId);
  }

  return NextResponse.json({ status: outcome, dev: true, result });
}
