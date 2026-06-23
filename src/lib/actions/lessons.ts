"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Marca/desmarca uma aula como concluída para o usuário logado.
 * RLS garante que o aluno só altera o PRÓPRIO progresso.
 */
export async function toggleLessonComplete(
  lessonId: string,
  completed: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) return { ok: false, error: error.message };

  // Recalcula conquistas (1ª aula, 5 aulas, módulo concluído, etc.).
  await supabase.rpc("recompute_achievements");

  revalidatePath(`/aula/${lessonId}`);
  revalidatePath("/aulas");
  revalidatePath("/inicio");
  revalidatePath("/conta");
  return { ok: true };
}

/** Publica um comentário na aula (RLS garante user_id = próprio). */
export async function addComment(lessonId: string, body: string) {
  const text = body.trim();
  if (!text) return { ok: false, error: "Escreva uma mensagem." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase
    .from("lesson_comments")
    .insert({ lesson_id: lessonId, user_id: user.id, body: text });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/aula/${lessonId}`);
  return { ok: true };
}
