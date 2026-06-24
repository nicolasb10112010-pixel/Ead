"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Loader2,
  ImageIcon,
  Paperclip,
  Plus,
  Coins,
  X,
  Bot,
  MessageSquare,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AI_CREDIT_COST } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string };

export function ChatUI({
  agentSlug,
  initialBalance,
  conversations,
  activeConversationId,
  initialMessages,
}: {
  agentSlug: string;
  initialBalance: number;
  conversations: Conversation[];
  activeConversationId: string | null;
  initialMessages: Msg[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [convId, setConvId] = useState<string | null>(activeConversationId);
  const [balance, setBalance] = useState(initialBalance);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [image, setImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const [file, setFile] = useState<{ text: string; name: string } | null>(null);

  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const minCost = AI_CREDIT_COST.text;
  const blocked = balance < minCost;

  const nextCost = file
    ? AI_CREDIT_COST.file
    : image
    ? AI_CREDIT_COST.image
    : AI_CREDIT_COST.text;

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      setError("Imagem muito grande (máx. 4MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setImage({ dataUrl: reader.result as string, name: f.name });
    reader.readAsDataURL(f);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1 * 1024 * 1024) {
      setError("Arquivo muito grande (máx. 1MB de texto).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setFile({ text: reader.result as string, name: f.name });
    reader.readAsText(f);
  }

  async function send() {
    if (sending || blocked) return;
    if (!input.trim() && !image && !file) return;

    setError(null);
    const userMsg: Msg = {
      role: "user",
      content:
        input.trim() ||
        (image ? `[imagem: ${image.name}]` : file ? `[arquivo: ${file.name}]` : ""),
    };
    setMessages((m) => [...m, userMsg]);
    setSending(true);

    const payload = {
      conversationId: convId,
      agentSlug,
      message: input.trim(),
      imageDataUrl: image?.dataUrl ?? null,
      fileText: file?.text ?? null,
    };
    setInput("");
    setImage(null);
    setFile(null);

    try {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 402) {
        setError("Seus créditos acabaram.");
        setBalance(0);
        setMessages((m) => m.slice(0, -1)); // remove a otimista
        setSending(false);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Erro ao falar com a IA.");
        setMessages((m) => m.slice(0, -1));
        setSending(false);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      setBalance(data.balance);
      if (!convId && data.conversationId) {
        setConvId(data.conversationId);
        // Atualiza a URL sem recarregar, e revalida a lista de conversas.
        router.replace(`/ia/${agentSlug}?c=${data.conversationId}`);
        router.refresh();
      }
    } catch {
      setError("Falha de conexão.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Lista de conversas */}
      <aside className="hidden w-60 shrink-0 flex-col rounded-2xl border border-border bg-surface/60 p-3 md:flex">
        <Link href={`/ia/${agentSlug}`}>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4" /> Nova conversa
          </Button>
        </Link>
        <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="px-2 py-3 text-xs text-muted">
              Suas conversas aparecerão aqui.
            </p>
          )}
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/ia/${agentSlug}?c=${c.id}`}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                c.id === convId
                  ? "bg-primary/15 text-foreground"
                  : "text-muted hover:bg-surface-2"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{c.title}</span>
            </Link>
          ))}
        </div>
      </aside>

      {/* Painel do chat */}
      <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface/40">
        {/* Saldo — destaque premium no topo (número grande). */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Link href="/creditos">
            <Button size="sm" variant="ghost">
              Comprar créditos
            </Button>
          </Link>
          <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-2 shadow-[0_0_24px_-8px_var(--accent)]">
            <Zap className="h-6 w-6 text-accent" />
            <div className="leading-none">
              <div className="text-2xl font-bold tracking-tight text-accent">
                {balance.toLocaleString("pt-BR")}
              </div>
              <div className="mt-0.5 text-[11px] text-muted">
                créditos disponíveis
              </div>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
                <Bot className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm">
                Comece uma conversa. Pergunte como aplicar o conteúdo do curso.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-surface"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border bg-surface px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Bloqueio por falta de crédito */}
        {blocked ? (
          <div className="border-t border-border p-4 text-center">
            <p className="text-sm text-muted">
              Você ficou sem créditos para usar a IA. Compre mais créditos para
              continuar.
            </p>
            <Link href="/creditos">
              <Button className="mt-3">
                <Coins className="h-4 w-4" /> Comprar créditos
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border-t border-border p-3">
            {/* Anexos selecionados */}
            {(image || file) && (
              <div className="mb-2 flex flex-wrap gap-2">
                {image && (
                  <span className="flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-xs">
                    <ImageIcon className="h-3 w-3" /> {image.name}
                    <button onClick={() => setImage(null)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {file && (
                  <span className="flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-xs">
                    <Paperclip className="h-3 w-3" /> {file.name}
                    <button onClick={() => setFile(null)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {error && <p className="mb-2 text-sm text-danger">{error}</p>}

            <div className="flex items-end gap-2">
              <button
                onClick={() => imageRef.current?.click()}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-surface-2"
                aria-label="Enviar imagem"
                title={`Imagem (${AI_CREDIT_COST.image} créditos)`}
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-surface-2"
                aria-label="Enviar arquivo"
                title={`Arquivo (${AI_CREDIT_COST.file} créditos)`}
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImage}
              />
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.csv,.json,text/*"
                className="hidden"
                onChange={handleFile}
              />

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Digite sua mensagem..."
                className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/60"
              />

              <Button onClick={send} disabled={sending} size="md">
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-right text-[11px] text-muted">
              Esta mensagem consome {nextCost} créditos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
