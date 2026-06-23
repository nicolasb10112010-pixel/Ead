import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TicketThread } from "@/components/support/ticket-thread";
import { StudentReply } from "@/components/support/student-reply";
import { createClient } from "@/lib/supabase/server";
import { TICKET_STATUS, categoryLabel } from "@/lib/constants";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, subject, category, message, status, attachment_url")
    .eq("id", id)
    .maybeSingle();

  if (!ticket) notFound();

  const { data: replies } = await supabase
    .from("support_replies")
    .select("id, body, is_admin, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  const st = TICKET_STATUS[ticket.status];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/suporte"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para suporte
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <p className="text-sm text-muted">{categoryLabel(ticket.category)}</p>
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
        <StudentReply ticketId={ticket.id} closed={ticket.status === "closed"} />
      </Card>
    </div>
  );
}
