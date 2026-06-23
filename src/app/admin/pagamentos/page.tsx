import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { formatBRL } from "@/lib/constants";

export const metadata = { title: "Pagamentos — Admin" };

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-success/15 text-success",
  pending: "bg-warning/15 text-warning",
  failed: "bg-danger/15 text-danger",
  canceled: "bg-surface-2 text-muted",
};

export default async function AdminPagamentos() {
  const { admin } = await requireAdmin();

  const [{ data: orders }, { data: events }] = await Promise.all([
    admin
      .from("orders")
      .select("id, status, amount_cents, credits_total, created_at, provider, provider_payment_id")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("payment_events")
      .select("id, provider, event_type, provider_event_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-xl font-semibold">Pedidos</h1>
        {!orders || orders.length === 0 ? (
          <Card>
            <CardDescription>Nenhum pedido ainda.</CardDescription>
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="px-3 py-3">Pedido</th>
                  <th className="px-3 py-3">Valor</th>
                  <th className="px-3 py-3">Créditos</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-3 py-3 font-mono text-xs">
                      {o.id.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-3">{formatBRL(o.amount_cents)}</td>
                    <td className="px-3 py-3">{o.credits_total}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          STATUS_STYLE[o.status] ?? "bg-surface-2 text-muted"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Eventos de pagamento (webhook)</h2>
        {!events || events.length === 0 ? (
          <Card>
            <CardTitle>Nenhum evento recebido</CardTitle>
            <CardDescription>
              Os eventos do Mercado Pago aparecem aqui quando o webhook é
              chamado (requer URL pública).
            </CardDescription>
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="px-3 py-3">Provedor</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">ID do evento</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-3 py-3">{e.provider}</td>
                    <td className="px-3 py-3">{e.event_type}</td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {e.provider_event_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
