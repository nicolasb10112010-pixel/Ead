import type { createAdminClient } from "@/lib/supabase/server";
import type { MpPayment } from "@/lib/gateways/mercadopago";

type Admin = ReturnType<typeof createAdminClient>;

export type ProcessResult =
  | { ok: true; credited?: number; status: string; duplicate?: boolean }
  | { ok: false; reason: string };

/**
 * Processa um pagamento de forma IDEMPOTENTE e segura.
 * Usado tanto pelo webhook quanto pela API de criação de pagamento (Brick).
 *
 * Garantias:
 *  - Idempotência: grava payment_events com unique (provider, provider_event_id).
 *    Reentrega do mesmo pagamento NÃO credita de novo.
 *  - Só credita se status = approved.
 *  - Valida que o valor pago bate com o total do pedido.
 *  - Crédito é feito pela SERVICE ROLE (admin), nunca pelo front.
 */
export async function processPayment(
  admin: Admin,
  payment: MpPayment
): Promise<ProcessResult> {
  // 1. Idempotência — registra o evento.
  const { error: evtErr } = await admin.from("payment_events").insert({
    provider: "mercadopago",
    event_type: "payment",
    provider_event_id: payment.id,
    transaction_id: payment.id,
    order_id: payment.externalReference,
    status: "received",
    raw: payment,
  });
  if (evtErr) {
    if (evtErr.code === "23505") {
      return { ok: true, duplicate: true, status: payment.status };
    }
    return { ok: false, reason: evtErr.message };
  }

  // 2. Só credita se aprovado e com pedido vinculado.
  if (payment.status !== "approved" || !payment.externalReference) {
    await admin
      .from("payment_events")
      .update({ status: "ignored", processed_at: new Date().toISOString() })
      .eq("provider_event_id", payment.id);
    return { ok: true, status: payment.status };
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, credits_total, amount_cents, status, course_id")
    .eq("id", payment.externalReference)
    .maybeSingle();

  if (!order) {
    await admin
      .from("payment_events")
      .update({ status: "ignored", processed_at: new Date().toISOString() })
      .eq("provider_event_id", payment.id);
    return { ok: false, reason: "pedido inexistente" };
  }

  if (order.status === "paid") {
    await admin
      .from("payment_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("provider_event_id", payment.id);
    return { ok: true, status: "already_paid" };
  }

  // 3. Validação de valor: o pago precisa bater com o total do pedido.
  if (
    payment.amountCents != null &&
    Math.abs(payment.amountCents - order.amount_cents) > 1
  ) {
    await admin
      .from("payment_events")
      .update({ status: "failed", processed_at: new Date().toISOString() })
      .eq("provider_event_id", payment.id);
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return { ok: false, reason: "valor divergente" };
  }

  // 4a. Pedido de CURSO → cria a matrícula ativa (acesso ao conteúdo).
  if (order.course_id) {
    await admin.from("enrollments").upsert(
      {
        user_id: order.user_id,
        course_id: order.course_id,
        status: "active",
      },
      { onConflict: "user_id,course_id" }
    );
  }

  // 4b. Pedido de CRÉDITOS → credita (add_credits_for ignora amount<=0).
  await admin.rpc("add_credits_for", {
    p_user_id: order.user_id,
    p_amount: order.credits_total,
    p_type: "purchase",
    p_reason: `order:${order.id}`,
    p_order_id: order.id,
  });

  await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      provider_payment_id: payment.id,
    })
    .eq("id", order.id);

  await admin
    .from("payment_events")
    .update({ status: "processed", processed_at: new Date().toISOString() })
    .eq("provider_event_id", payment.id);

  // 5. Esvazia o carrinho do comprador.
  const { data: cart } = await admin
    .from("carts")
    .select("id")
    .eq("user_id", order.user_id)
    .maybeSingle();
  if (cart) await admin.from("cart_items").delete().eq("cart_id", cart.id);

  return { ok: true, credited: order.credits_total, status: "approved" };
}
