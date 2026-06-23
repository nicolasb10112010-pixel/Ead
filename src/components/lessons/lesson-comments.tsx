import { MessageSquare, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CommentForm } from "./comment-form";

/** Seção de comentários da aula: lista + formulário de envio. */
export async function LessonComments({ lessonId }: { lessonId: string }) {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from("lesson_comments")
    .select("id, body, created_at, user_id")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false });

  const rows = comments ?? [];

  // Busca os nomes dos autores (a RLS de profiles limita o que é visível;
  // autores fora do alcance caem para "Aluno").
  const authorIds = [...new Set(rows.map((c) => c.user_id))];
  const nameById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    (profiles ?? []).forEach((p) => {
      if (p.full_name) nameById.set(p.id, p.full_name);
    });
  }

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5" /> Comentários
      </h2>

      <div className="mb-6">
        <CommentForm lessonId={lessonId} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          Seja o primeiro a comentar nesta aula.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((c) => (
            <li key={c.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 text-muted">
                <User className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border border-border bg-surface/60 px-4 py-3">
                <p className="text-sm font-medium">
                  {nameById.get(c.user_id) ?? "Aluno"}
                </p>
                <p className="mt-1 text-sm text-muted whitespace-pre-wrap">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
