import Link from "next/link";
import { PlayCircle, Trophy, Coins, TrendingUp, Zap } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiCard } from "@/components/ia/ai-card";
import { CourseCard } from "@/components/courses/course-card";
import { ProgressBar } from "@/components/lessons/progress-bar";
import { AI_AGENTS } from "@/lib/constants";
import { getAccountData } from "@/lib/account";
import { getCourseOverview, getCoursesForStore } from "@/lib/courses";

export const metadata = { title: "Início — Trilogia do Sucesso" };

export default async function InicioPage() {
  const [account, overview, allCourses] = await Promise.all([
    getAccountData(),
    getCourseOverview(),
    getCoursesForStore(),
  ]);

  // Mostra primeiro os cursos ainda não comprados (vitrine de venda).
  const courses = [...allCourses].sort(
    (a, b) => Number(a.enrolled) - Number(b.enrolled)
  );

  const fullName = account?.fullName ?? "aluno";
  const credits = account?.credits ?? 0;
  const achievementsCount = account?.unlockedSlugs.length ?? 0;
  const pct =
    overview && overview.totalLessons
      ? (overview.completedLessons / overview.totalLessons) * 100
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">
          Olá, {fullName}. Bem-vindo de volta.
        </h1>
        <p className="mt-1 text-sm text-muted">
          Continue de onde parou e avance na sua jornada.
        </p>
      </div>

      {/* Destaque dos créditos de IA */}
      <Card className="flex flex-col gap-4 border-accent/30 bg-gradient-to-r from-accent/10 to-transparent sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-[0_0_24px_-8px_var(--accent)]">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted">Seus créditos de IA</p>
            <p className="text-2xl font-bold text-accent">
              {credits.toLocaleString("pt-BR")}{" "}
              <span className="text-sm font-normal text-muted">
                créditos disponíveis
              </span>
            </p>
          </div>
        </div>
        <Link href="/creditos">
          <Button variant="outline">
            <Coins className="h-4 w-4" /> Comprar mais créditos
          </Button>
        </Link>
      </Card>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted">Progresso geral</p>
            <p className="text-lg font-semibold">{Math.round(pct)}%</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted">Créditos disponíveis</p>
            <p className="text-lg font-semibold">
              {credits.toLocaleString("pt-BR")}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted">Conquistas</p>
            <p className="text-lg font-semibold">{achievementsCount}</p>
          </div>
        </Card>
      </div>

      {/* Continuar assistindo */}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-primary">
            <PlayCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle>Continuar assistindo</CardTitle>
            {overview?.nextLesson ? (
              <CardDescription>{overview.nextLesson.title}</CardDescription>
            ) : (
              <CardDescription>
                Suas aulas aparecerão aqui assim que você começar.
              </CardDescription>
            )}
            {overview && overview.totalLessons > 0 && (
              <div className="mt-2 max-w-xs">
                <ProgressBar value={pct} />
              </div>
            )}
          </div>
        </div>
        <Link
          href={
            overview?.nextLesson ? `/aula/${overview.nextLesson.id}` : "/cursos"
          }
        >
          <Button>{overview?.nextLesson ? "Assistir" : "Ver cursos"}</Button>
        </Link>
      </Card>

      {/* Cards das IAs */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Suas IAs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_AGENTS.map((agent) => (
            <AiCard key={agent.slug} agent={agent} />
          ))}
        </div>
      </div>

      {/* Cursos disponíveis para você */}
      {courses.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cursos disponíveis para você</h2>
            <Link href="/cursos" className="text-sm text-muted hover:text-foreground">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 3).map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
