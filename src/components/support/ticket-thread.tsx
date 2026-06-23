import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThreadReply = {
  id: string;
  body: string;
  is_admin: boolean;
  created_at: string;
};

/** Exibe a mensagem inicial + respostas de um chamado. Reusável (aluno/admin). */
export function TicketThread({
  message,
  attachmentUrl,
  replies,
}: {
  message: string;
  attachmentUrl: string | null;
  replies: ThreadReply[];
}) {
  return (
    <div className="space-y-3">
      {/* Mensagem inicial do aluno */}
      <div className="rounded-2xl border border-border bg-surface/60 p-4">
        <p className="text-xs text-muted">Aluno</p>
        <p className="mt-1 text-sm whitespace-pre-wrap">{message}</p>
        {attachmentUrl && (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <Paperclip className="h-3 w-3" /> Ver anexo
          </a>
        )}
      </div>

      {replies.map((r) => (
        <div
          key={r.id}
          className={cn(
            "rounded-2xl border p-4",
            r.is_admin
              ? "border-primary/40 bg-primary/10"
              : "border-border bg-surface/60"
          )}
        >
          <p className="text-xs text-muted">
            {r.is_admin ? "Suporte" : "Aluno"}
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{r.body}</p>
        </div>
      ))}
    </div>
  );
}
