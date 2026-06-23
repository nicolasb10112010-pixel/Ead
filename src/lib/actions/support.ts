"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Abre um novo chamado de suporte. */
export async function createTicket(input: {
  subject: string;
  category: string;
  message: string;
  attachmentUrl?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  if (!input.subject.trim() || !input.message.trim())
    return { ok: false, error: "Preencha assunto e mensagem." };

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      subject: input.subject.trim(),
      category: input.category,
      message: input.message.trim(),
      attachment_url: input.attachmentUrl ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Falha ao abrir chamado." };
  revalidatePath("/suporte");
  return { ok: true, ticketId: data.id };
}

/** Aluno responde no próprio chamado (reabre como 'open'). */
export async function replyToTicket(ticketId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  if (!body.trim()) return { ok: false, error: "Escreva uma mensagem." };

  const { error } = await supabase.from("support_replies").insert({
    ticket_id: ticketId,
    author_id: user.id,
    is_admin: false,
    body: body.trim(),
  });
  if (error) return { ok: false, error: error.message };

  await supabase
    .from("support_tickets")
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .eq("user_id", user.id);

  revalidatePath(`/suporte/${ticketId}`);
  return { ok: true };
}

/** Aluno fecha o próprio chamado. */
export async function closeTicket(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  await supabase
    .from("support_tickets")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .eq("user_id", user.id);

  revalidatePath(`/suporte/${ticketId}`);
  revalidatePath("/suporte");
  return { ok: true };
}
