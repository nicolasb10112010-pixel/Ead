import Link from "next/link";
import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/lessons/progress-bar";
import { getCourseOverview } from "@/lib/courses";
import { cn } from "@/lib/utils";

export const metadata = { title: "Aulas — Trilogia do Sucesso" };

export default async function AulasPage() {
  const overview = await getCourseOverview();

  // Sem matrícula ativa → não há curso visível (RLS) → orienta a compra.
  if (!overview || overview.totalLessons === 0) {
    return (
      <div>
        <PageHeader
          title="Suas aulas"
          subtitle="Continue sua jornada de aprendizado. Assista às aulas no seu ritmo, acompanhe seu progresso e avance para os próximos módulos."
        />
        <Card>
          <CardTitle>Nenhum curso liberado ainda</CardTitle>
          <CardDescription>
            Você ainda não tem uma matrícula ativa. Após a confirmação do
            pagamento, suas aulas aparecerão aqui.
          </CardDescription>
        </Card>
      </div>
    );
  }

  const { modules, totalLessons, completedLessons, nextLesson } = overview;
  const pct = totalLessons ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Suas aulas"
        subtitle="Continue sua jornada de aprendizado. Assista às aulas no seu ritmo, acompanhe seu progresso e avance para os próximos módulos."
      />

      {/* Continuar de onde parou */}
      {nextLesson && (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-primary">
              <PlayCircle className="h-6 w-6" />
            </div>
            <div>
              <CardDescription>Continuar de onde parou</CardDescription>
              <CardTitle>{nextLesson.title}</CardTitle>
            </div>
          </div>
          <Link href={`/aula/${nextLesson.id}`}>
            <Button>Assistir</Button>
          </Link>
        </Card>
      )}

      {/* Progresso geral */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Progresso geral</span>
          <span className="font-medium">
            {completedLessons}/{totalLessons} aulas ({Math.round(pct)}%)
          </span>
        </div>
        <ProgressBar value={pct} />
      </div>

      {/* Módulos e aulas */}
      <div className="space-y-6">
        {modules.map((mod) => (
          <div key={mod.id}>
            <h2 className="mb-3 text-lg font-semibold">{mod.title}</h2>
            <div className="space-y-2">
              {mod.lessons.map((lesson) => {
                const isCurrent = lesson.id === nextLesson?.id;
                const content = (
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 transition-colors",
                      !lesson.is_locked && "hover:bg-surface-2",
                      isCurrent && "ring-1 ring-primary/60",
                      lesson.is_locked && "opacity-60"
                    )}
                  >
                    {lesson.is_locked ? (
                      <Lock className="h-5 w-5 text-muted" />
                    ) : lesson.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted" />
                    )}
                    <span className="flex-1 text-sm">{lesson.title}</span>
                    {isCurrent && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                        Atual
                      </span>
                    )}
                  </div>
                );

                return lesson.is_locked ? (
                  <div key={lesson.id}>{content}</div>
                ) : (
                  <Link key={lesson.id} href={`/aula/${lesson.id}`}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
