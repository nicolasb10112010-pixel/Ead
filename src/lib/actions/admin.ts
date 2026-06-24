"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

/** Admin responde um chamado (marca como 'answered'). */
export async function adminReply(ticketId: string, body: string) {
  if (!body.trim()) return { ok: false, error: "Escreva uma resposta." };
  let admin, userId;
  try {
    ({ admin, userId } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }

  const { error } = await admin.from("support_replies").insert({
    ticket_id: ticketId,
    author_id: userId,
    is_admin: true,
    body: body.trim(),
  });
  if (error) return { ok: false, error: error.message };

  await admin
    .from("support_tickets")
    .update({ status: "answered", updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  revalidatePath(`/admin/chamados/${ticketId}`);
  return { ok: true };
}

/** Admin altera o status do chamado. */
export async function adminSetTicketStatus(ticketId: string, status: string) {
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  revalidatePath(`/admin/chamados/${ticketId}`);
  revalidatePath("/admin/chamados");
  return { ok: true };
}

/** Admin concede créditos a um aluno. */
export async function adminGrantCredits(userId: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0)
    return { ok: false, error: "Quantidade inválida." };
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin.rpc("add_credits_for", {
    p_user_id: userId,
    p_amount: Math.floor(amount),
    p_type: "grant",
    p_reason: "admin",
  });
  revalidatePath("/admin/alunos");
  return { ok: true };
}

/** Admin ativa/expira a matrícula de um aluno no curso principal. */
export async function adminSetEnrollment(
  userId: string,
  courseId: string,
  active: boolean
) {
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  await admin.from("enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      status: active ? "active" : "expired",
    },
    { onConflict: "user_id,course_id" }
  );
  revalidatePath("/admin/alunos");
  return { ok: true };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Admin cria um novo curso (publicado, com preço em centavos). */
export async function adminCreateCourse(input: {
  title: string;
  priceCents: number;
  description?: string;
}) {
  if (!input.title.trim()) return { ok: false, error: "Informe o título." };
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }

  const base = slugify(input.title) || "curso";
  // Sufixo curto para evitar colisão de slug.
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const { count } = await admin
    .from("courses")
    .select("id", { count: "exact", head: true });

  const { error } = await admin.from("courses").insert({
    slug,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    price_cents: Math.max(0, Math.floor(input.priceCents)),
    position: (count ?? 0) + 1,
    is_published: true,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/conteudo");
  return { ok: true, slug };
}

/** Admin edita um curso: preço, capa, descrição e publicação. */
export async function adminUpdateCourse(input: {
  courseId: string;
  priceCents?: number;
  coverImageUrl?: string;
  shortDescription?: string;
  isPublished?: boolean;
}) {
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }

  const patch: Record<string, unknown> = {};
  if (input.priceCents !== undefined)
    patch.price_cents = Math.max(0, Math.floor(input.priceCents));
  if (input.coverImageUrl !== undefined)
    patch.cover_image_url = input.coverImageUrl.trim() || null;
  if (input.shortDescription !== undefined)
    patch.short_description = input.shortDescription.trim() || null;
  if (input.isPublished !== undefined) patch.is_published = input.isPublished;

  await admin.from("courses").update(patch).eq("id", input.courseId);
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Admin cria um módulo. */
export async function adminCreateModule(courseId: string, title: string) {
  if (!title.trim()) return { ok: false, error: "Informe o título." };
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  const { count } = await admin
    .from("course_modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);
  await admin.from("course_modules").insert({
    course_id: courseId,
    title: title.trim(),
    position: (count ?? 0) + 1,
  });
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Admin cria uma aula (com embed externo opcional). */
export async function adminCreateLesson(input: {
  moduleId: string;
  title: string;
  description?: string;
  videoEmbed?: string;
}) {
  if (!input.title.trim()) return { ok: false, error: "Informe o título." };
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  const { count } = await admin
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", input.moduleId);
  await admin.from("lessons").insert({
    module_id: input.moduleId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    video_embed: input.videoEmbed?.trim() || null,
    position: (count ?? 0) + 1,
  });
  revalidatePath("/admin/conteudo");
  return { ok: true };
}

/** Admin atualiza o embed/descrição de uma aula. */
export async function adminUpdateLesson(input: {
  lessonId: string;
  title?: string;
  description?: string;
  videoEmbed?: string;
}) {
  let admin;
  try {
    ({ admin } = await requireAdmin());
  } catch {
    return { ok: false, error: "Acesso negado." };
  }
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined)
    patch.description = input.description.trim() || null;
  if (input.videoEmbed !== undefined)
    patch.video_embed = input.videoEmbed.trim() || null;

  await admin.from("lessons").update(patch).eq("id", input.lessonId);
  revalidatePath("/admin/conteudo");
  return { ok: true };
}
