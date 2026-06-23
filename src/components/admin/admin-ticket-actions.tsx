"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminReply, adminSetTicketStatus } from "@/lib/actions/admin";

export function AdminTicketActions({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function reply() {
    start(async () => {
      const res = await adminReply(ticketId, body);
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    });
  }

  function setStatus(s: string) {
    start(async () => {
      await adminSetTicketStatus(ticketId, s);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Responder ao aluno..."
        className="w-full resize-none rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/60"
      />
      <div className="flex flex-wrap gap-3">
        <Button onClick={reply} disabled={pending || !body.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Responder
        </Button>
        {status !== "closed" ? (
          <Button variant="outline" onClick={() => setStatus("closed")} disabled={pending}>
            Fechar chamado
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setStatus("open")} disabled={pending}>
            Reabrir
          </Button>
        )}
      </div>
    </div>
  );
}
