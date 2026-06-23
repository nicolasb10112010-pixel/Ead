import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { TICKET_STATUS, categoryLabel } from "@/lib/constants";

export const metadata = { title: "Chamados — Admin" };

export default async function AdminChamados() {
  const { admin } = await requireAdmin();

  const { data: tickets } = await admin
    .from("support_tickets")
    .select("id, subject, category, status, created_at, user_id")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Chamados</h1>
      {!tickets || tickets.length === 0 ? (
        <Card>
          <CardDescription>Nenhum chamado ainda.</CardDescription>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const st = TICKET_STATUS[t.status];
            return (
              <Link key={t.id} href={`/admin/chamados/${t.id}`}>
                <Card className="flex items-center justify-between hover:bg-surface-2">
                  <div>
                    <CardTitle>{t.subject}</CardTitle>
                    <CardDescription>{categoryLabel(t.category)}</CardDescription>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] ${st.className}`}>
                    {st.label}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
