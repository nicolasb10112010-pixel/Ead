"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SUPPORT_CATEGORIES } from "@/lib/constants";
import { createTicket } from "@/lib/actions/support";

export function TicketForm({ userId }: { userId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>(SUPPORT_CATEGORIES[0].value);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Anexo muito grande (máx. 5MB).");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = f.name.split(".").pop() ?? "bin";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("support").upload(path, f);
    if (error) {
      setError("Falha no upload do anexo.");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("support").getPublicUrl(path);
    setAttachment({ url: data.publicUrl, name: f.name });
    setUploading(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createTicket({
        subject,
        category,
        message,
        attachmentUrl: attachment?.url ?? null,
      });
      if (res.ok && res.ticketId) {
        router.push(`/suporte/${res.ticketId}`);
      } else {
        setError(res.error ?? "Erro ao abrir chamado.");
      }
    });
  }

  return (
    <Card>
      <CardTitle>Abrir chamado</CardTitle>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label className="text-sm text-muted">Assunto</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-4 h-11 text-sm outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
        <div>
          <label className="text-sm text-muted">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-4 h-11 text-sm outline-none focus:ring-2 focus:ring-primary/60"
          >
            {SUPPORT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-muted">Mensagem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="mt-1 w-full resize-none rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-border px-3 h-10 text-sm text-muted hover:bg-surface-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
            Anexo (opcional)
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          {attachment && (
            <span className="flex items-center gap-1 text-xs text-muted">
              {attachment.name}
              <button type="button" onClick={() => setAttachment(null)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={pending || uploading}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar
        </Button>
      </form>
    </Card>
  );
}
