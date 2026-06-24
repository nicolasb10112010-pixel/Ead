import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
  GraduationCap,
} from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/lessons/progress-bar";
import { BuyCourseButton } from "@/components/courses/buy-course-button";
import { CourseCard } from "@/components/courses/course-card";
import { getCourseDetail, getCoursesForStore } from "@/lib/courses";
import { formatBRL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default async function CursoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCourseDetail(slug);
  if (!data) notFound();

  const { course, enrolled, modules, totalLessons, completedLessons, nextLesson } =
    data;

  return (
    <div className="space-y-8">
      <Link
        href="/cursos"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para cursos
      </Link>

      {/* Não matriculado → bloqueio com capa borrada */}
      {!enrolled ? (
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[21/9] w-full overflow-hidden">
            {course.coverImageUrl ? (
              <Image
                src={course.coverImageUrl}
                alt={course.title}
                fill
                unoptimized
                className="object-cover blur-md scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/30 via-surface-2 to-accent/20 blur-[2px]" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="mt-1 text-2xl font-bold text-white">{course.title}</h1>
            </div>
          </div>
          <div className="flex flex-col items-center p-6 text-center">
            <CardDescription className="max-w-md">
              Esse curso ainda não está liberado na sua conta. Compre agora para
              acessar as aulas.
            </CardDescription>
            {course.description && (
              <p className="mt-3 max-w-md text-sm text-muted">
                {course.description}
              </p>
            )}
            <p className="mt-4 text-2xl font-bold">
              {course.price_cents > 0 ? formatBRL(course.price_cents) : "Gratuito"}
            </p>
            {course.price_cents > 0 && (
              <BuyCourseButton
                slug={course.slug}
                label="Comprar agora"
                size="lg"
                className="mt-4 w-full max-w-xs"
              />
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{course.title}</h1>
              {course.description && (
                <p className="text-sm text-muted">{course.description}</p>
              )}
            </div>
          </div>

          {/* Continuar + progresso */}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Progresso</span>
              <span className="font-medium">
                {completedLessons}/{totalLessons} aulas
              </span>
            </div>
            <ProgressBar
              value={totalLessons ? (completedLessons / totalLessons) * 100 : 0}
            />
          </div>

          {/* Módulos e aulas */}
          <div className="space-y-6">
            {modules.map((mod) => (
              <div key={mod.id}>
                <h2 className="mb-3 text-lg font-semibold">{mod.title}</h2>
                <div className="space-y-2">
                  {mod.lessons.map((lesson) => (
                    <Link key={lesson.id} href={`/aula/${lesson.id}`}>
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 transition-colors hover:bg-surface-2",
                          lesson.id === nextLesson?.id && "ring-1 ring-primary/60"
                        )}
                      >
                        {lesson.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted" />
                        )}
                        <span className="flex-1 text-sm">{lesson.title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Outros cursos disponíveis (não comprados) */}
      <OtherCourses excludeSlug={slug} />
    </div>
  );
}

async function OtherCourses({ excludeSlug }: { excludeSlug: string }) {
  const all = await getCoursesForStore();
  const others = all.filter((c) => !c.enrolled && c.slug !== excludeSlug);
  if (others.length === 0) return null;

  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-4 text-lg font-semibold">Outros cursos disponíveis</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {others.slice(0, 3).map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </section>
  );
}
