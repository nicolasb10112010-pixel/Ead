import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TicketThread } from "@/components/support/ticket-thread";
import { AdminTicketActions } from "@/components/admin/admin-ticket-actions";
import { requireAdmin } from "@/lib/admin";
import { TICKET_STATUS, categoryLabel } from "@/lib/constants";

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { admin } = await requireAdmin();

  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id, subject, category, message, status, attachment_url, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) notFound();

  const [{ data: replies }, { data: profile }] = await Promise.all([
    admin
      .from("support_replies")
      .select("id, body, is_admin, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
    admin
      .from("profiles")
      .select("full_name")
      .eq("id", ticket.user_id)
      .maybeSingle(),
  ]);

  const st = TICKET_STATUS[ticket.status];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/chamados"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos chamados
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <p className="text-sm text-muted">
            {categoryLabel(ticket.category)} · {profile?.full_name ?? "Aluno"}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] ${st.className}`}>
          {st.label}
        </span>
      </div>

      <TicketThread
        message={ticket.message}
        attachmentUrl={ticket.attachment_url}
        replies={replies ?? []}
      />

      <Card>
        <AdminTicketActions ticketId={ticket.id} status={ticket.status} />
      </Card>
    </div>
  );
}
