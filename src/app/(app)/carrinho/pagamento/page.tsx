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
    .select("id, amount_cents, credits_total, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) redirect("/carrinho");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Pagamento"
        subtitle="Finalize sua compra com segurança, sem sair da Trilogia do Sucesso."
      />

      {/* Resumo do pedido */}
      <Card className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Créditos</span>
          <span className="font-medium">
            {order.credits_total.toLocaleString("pt-BR")}
          </span>
        </div>
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">{formatBRL(order.amount_cents)}</span>
        </div>
      </Card>

      {/* Checkout embarcado (Payment Brick) ou modo dev */}
      <CreditsCheckout orderId={order.id} amountCents={order.amount_cents} />

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <Lock className="h-3 w-3" />
        Pagamento processado pelo Mercado Pago. Seus créditos entram após a
        confirmação.
      </p>
    </div>
  );
}
