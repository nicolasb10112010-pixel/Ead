import { MessageSquare } from "lucide-react";

/**
 * Seção de comentários da aula.
 * Estrutura visual pronta na Fase 2; a interação (listar/enviar via
 * lesson_comments) é ligada na Fase 3.
 */
export function LessonComments({ lessonId }: { lessonId: string }) {
  return (
    <section data-lesson-id={lessonId}>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5" /> Comentários
      </h2>
      <div className="rounded-2xl border border-border bg-surface/60 p-5 text-sm text-muted">
        Os comentários chegam na Fase 3. Aqui o aluno poderá comentar e ver as
        respostas.
      </div>
    </section>
  );
}
