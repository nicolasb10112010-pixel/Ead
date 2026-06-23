import Link from "next/link";
import { PlayCircle, Trophy, Coins, TrendingUp } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiCard } from "@/components/ia/ai-card";
import { ProgressBar } from "@/components/lessons/progress-bar";
import { AI_AGENTS } from "@/lib/constants";
import { getAccountData } from "@/lib/account";
import { getCourseOverview } from "@/lib/courses";

export const metadata = { title: "Início — Trilogia do Sucesso" };

export default async function InicioPage() {
  const [account, overview] = await Promise.all([
    getAccountData(),
    getCourseOverview(),
  ]);

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
            overview?.nextLesson ? `/aula/${overview.nextLesson.id}` : "/aulas"
          }
        >
          <Button>{overview?.nextLesson ? "Assistir" : "Ir para aulas"}</Button>
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
    </div>
  );
}
