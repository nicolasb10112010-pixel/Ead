import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { ProgressBar } from "@/components/lessons/progress-bar";

/**
 * Header da página da aula. Substitui o menu lateral para dar foco ao
 * conteúdo (regra do projeto: na aula o menu some).
 */
export function FocusHeader({ progressPct }: { progressPct: number }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent" />
          <span className="hidden font-semibold sm:inline">{APP_NAME}</span>
        </div>

        <Link
          href="/aulas"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar para aulas</span>
        </Link>

        <div className="mx-auto hidden w-48 md:block">
          <ProgressBar value={progressPct} />
        </div>

        <Link
          href="/conta"
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Minha conta</span>
        </Link>
      </div>
    </header>
  );
}
