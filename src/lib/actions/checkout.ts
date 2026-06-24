"use server";

import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/cart";
import { UPSELL_REQUIRES_MAIN_MESSAGE } from "@/lib/constants";

/**
 * Cria um pedido `pending` a partir do carrinho (com order_items) e retorna
 * o id. NÃO redireciona para fora: o pagamento acontece dentro da plataforma
 * (Payment Brick). Os créditos só entram depois, via webhook/API (approved).
 */
export async function createCreditOrder(): Promise<
  { ok: true; orderId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const cart = await getCart();
  if (cart.items.length === 0)
    return { ok: false, error: "Seu carrinho está vazio." };

  // Segurança: nunca permitir comprar só upsell.
  if (cart.onlyUpsell) return { ok: false, error: UPSELL_REQUIRES_MAIN_MESSAGE };

  // 1. Cria o pedido.
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      amount_cents: cart.totalCents,
      credits_total: cart.totalCredits,
      items: cart.items.map((i) => ({
        slug: i.slug,
        credits: i.credits,
        quantity: i.quantity,
        price_cents: i.priceCents,
        is_upsell: i.isUpsell,
      })),
      provider: "mercadopago",
    })
    .select("id")
    .single();

  if (error || !order) return { ok: false, error: "Falha ao criar o pedido." };

  // 2. order_items: insere os principais primeiro, depois os upsells
  //    apontando parent_item_id para o primeiro item principal.
  const mains = cart.items.filter((i) => !i.isUpsell);
  const upsells = cart.items.filter((i) => i.isUpsell);

  const { data: insertedMains } = await supabase
    .from("order_items")
    .insert(
      mains.map((i) => ({
        order_id: order.id,
        package_slug: i.slug,
        credits: i.credits * i.quantity,
        price_cents: i.priceCents * i.quantity,
        is_upsell: false,
      }))
    )
    .select("id");

  const parentId = insertedMains?.[0]?.id ?? null;

  if (upsells.length > 0) {
    await supabase.from("order_items").insert(
      upsells.map((i) => ({
        order_id: order.id,
        package_slug: i.slug,
        credits: i.credits * i.quantity,
        price_cents: i.priceCents * i.quantity,
        is_upsell: true,
        parent_item_id: parentId,
      }))
    );
  }

  return { ok: true, orderId: order.id };
}

/**
 * Cria um pedido `pending` para a compra de um CURSO (pago em R$).
 * Os créditos não entram aqui; a matrícula é criada pelo webhook quando o
 * pagamento for aprovado.
 */
export async function createCourseOrder(
  courseSlug: string
): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, price_cents, is_published")
    .eq("slug", courseSlug)
    .maybeSingle();

  if (!course || !course.is_published)
    return { ok: false, error: "Curso indisponível." };
  if (course.price_cents <= 0)
    return { ok: false, error: "Este curso não está à venda." };

  // Já matriculado?
  const { data: enr } = await supabase
    .from("enrollments")
    .select("status")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();
  if (enr?.status === "active")
    return { ok: false, error: "Você já tem acesso a este curso." };

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      amount_cents: course.price_cents,
      credits_total: 0,
      course_id: course.id,
      items: [
        {
          type: "course",
          slug: courseSlug,
          title: course.title,
          price_cents: course.price_cents,
        },
      ],
      provider: "mercadopago",
    })
    .select("id")
    .single();

  if (error || !order) return { ok: false, error: "Falha ao criar o pedido." };
  return { ok: true, orderId: order.id };
}
