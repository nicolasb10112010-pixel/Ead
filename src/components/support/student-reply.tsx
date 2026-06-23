"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { replyToTicket, closeTicket } from "@/lib/actions/support";

export function StudentReply({
  ticketId,
  closed,
}: {
  ticketId: string;
  closed: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  if (closed) {
    return (
      <p className="text-sm text-muted">
        Este chamado está fechado. Abra um novo se precisar de ajuda.
      </p>
    );
  }

  function send() {
    start(async () => {
      const res = await replyToTicket(ticketId, body);
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    });
  }

  function close() {
    start(async () => {
      await closeTicket(ticketId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Escreva uma resposta..."
        className="w-full resize-none rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/60"
      />
      <div className="flex gap-3">
        <Button onClick={send} disabled={pending || !body.trim()}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Responder
        </Button>
        <Button variant="outline" onClick={close} disabled={pending}>
          Fechar chamado
        </Button>
      </div>
    </div>
  );
}
