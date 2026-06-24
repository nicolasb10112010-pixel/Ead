import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createPayment } from "@/lib/gateways/mercadopago";
import { processPayment } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Cria o pagamento do pedido via Checkout Transparente (Payment Brick).
 * Recebe o formData do Brick, cria o pagamento no MP (Access Token só aqui),
 * e processa de forma idempotente (credita só se approved).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.orderId || !body?.formData) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Carrega o pedido do PRÓPRIO usuário (RLS) e exige estar pendente.
  const { data: order } = await supabase
    .from("orders")
    .select("id, amount_cents, status, credits_total")
    .eq("id", body.orderId)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (order.status === "paid")
    return NextResponse.json({ status: "approved", alreadyPaid: true });

  try {
    const payment = await createPayment({
      orderId: order.id,
      amountCents: order.amount_cents,
      description: "Créditos Trilogia do Sucesso",
      idempotencyKey: randomUUID(),
      formData: body.formData,
    });

    const admin = createAdminClient();
    const result = await processPayment(admin, payment);

    // Marca o pedido como falho se o pagamento foi recusado.
    if (payment.status === "rejected") {
      await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    }

    return NextResponse.json({
      status: payment.status,
      statusDetail: payment.statusDetail,
      credited: result.ok ? result.credited ?? 0 : 0,
    });
  } catch (e) {
    console.error("Erro createPayment:", e);
    return NextResponse.json(
      { error: "Falha ao processar o pagamento." },
      { status: 502 }
    );
  }
}
