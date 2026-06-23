import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FocusHeader } from "@/components/lessons/focus-header";
import { VideoEmbed } from "@/components/lessons/video-embed";
import { CompleteButton } from "@/components/lessons/complete-button";
import { LessonComments } from "@/components/lessons/lesson-comments";
import { Button } from "@/components/ui/button";
import { getLessonContext, getCourseOverview } from "@/lib/courses";

export default async function AulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getLessonContext(id);

  // RLS bloqueou (sem matrícula) ou aula inexistente.
  if (!ctx) notFound();

  const { lesson, index, total, prev, next, completed } = ctx;

  // Progresso do curso para a barra no header.
  const overview = await getCourseOverview();
  const pct =
    overview && overview.totalLessons
      ? (overview.completedLessons / overview.totalLessons) * 100
      : 0;

  return (
    <div className="min-h-screen">
      <FocusHeader progressPct={pct} />

      <main className="mx-auto max-w-4xl px-4 py-6 md:py-10 space-y-6">
        {/* Vídeo via embed externo (renderização segura) */}
        <VideoEmbed embed={lesson.video_embed} />

        <div>
          <p className="text-sm text-muted">
            Aula {index + 1} de {total}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{lesson.title}</h1>
          {lesson.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
          {prev ? (
            <Link href={`/aula/${prev.id}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Voltar aula
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled>
              <ArrowLeft className="h-4 w-4" />
              Voltar aula
            </Button>
          )}

          <CompleteButton lessonId={lesson.id} initialCompleted={completed} />

          {next ? (
            <Link href={`/aula/${next.id}`} className="ml-auto">
              <Button>
                Próxima aula
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button className="ml-auto" disabled>
              Próxima aula
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Comentários (UI completa na Fase 3) */}
        <LessonComments lessonId={lesson.id} />
      </main>
    </div>
  );
}
