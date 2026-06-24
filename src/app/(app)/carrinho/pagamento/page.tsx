import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { CreditsCheckout } from "@/components/checkout/credits-checkout";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/constants";

export const metadata = { title: "Pagamento — Trilogia do Sucesso" };

export default async function PagamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/carrinho");

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, amount_cents, credits_total, status, course_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) redirect("/carrinho");

  // Se for compra de curso, busca o nome/slug para o resumo e o pós-pagamento.
  let course: { slug: string; title: string } | null = null;
  if (order.course_id) {
    const { data } = await supabase
      .from("courses")
      .select("slug, title")
      .eq("id", order.course_id)
      .maybeSingle();
    course = data ?? null;
  }

  const success = course
    ? { href: `/cursos/${course.slug}`, label: "Acessar curso" }
    : { href: "/ia/ia-1", label: "Ir para a IA 1" };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Pagamento"
        subtitle="Finalize sua compra com segurança, sem sair da Trilogia do Sucesso."
      />

      {/* Resumo do pedido */}
      <Card className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{course ? "Curso" : "Créditos"}</span>
          <span className="font-medium">
            {course
              ? course.title
              : order.credits_total.toLocaleString("pt-BR")}
          </span>
        </div>
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">{formatBRL(order.amount_cents)}</span>
        </div>
      </Card>

      {/* Checkout embarcado (Payment Brick) ou modo dev */}
      <CreditsCheckout
        orderId={order.id}
        amountCents={order.amount_cents}
        successHref={success.href}
        successLabel={success.label}
      />

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <Lock className="h-3 w-3" />
        Pagamento processado pelo Mercado Pago. O acesso é liberado após a
        confirmação.
      </p>
    </div>
  );
}
