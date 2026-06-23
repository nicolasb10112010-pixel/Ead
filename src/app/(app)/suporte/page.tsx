import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { TicketForm } from "@/components/support/ticket-form";
import { createClient } from "@/lib/supabase/server";
import { TICKET_STATUS, categoryLabel } from "@/lib/constants";

export const metadata = { title: "Suporte — Trilogia do Sucesso" };

export default async function SuportePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Suporte"
        subtitle="Abra um chamado e acompanhe o status das suas solicitações."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TicketForm userId={user.id} />

        <div>
          <h2 className="mb-3 text-lg font-semibold">Meus chamados</h2>
          {!tickets || tickets.length === 0 ? (
            <Card>
              <CardDescription>
                Você ainda não abriu nenhum chamado.
              </CardDescription>
            </Card>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => {
                const st = TICKET_STATUS[t.status];
                return (
                  <Link key={t.id} href={`/suporte/${t.id}`}>
                    <Card className="flex items-center justify-between hover:bg-surface-2">
                      <div>
                        <CardTitle>{t.subject}</CardTitle>
                        <CardDescription>
                          {categoryLabel(t.category)}
                        </CardDescription>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] ${st.className}`}
                      >
                        {st.label}
                      </span>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
