"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import type { AiAgent } from "@/lib/constants";
import { Robot } from "@/components/ia/robot";
import { cn } from "@/lib/utils";

const LOCKED_MESSAGE =
  "Essa IA ainda está em breve. Continue evoluindo na Trilogia do Sucesso para desbloquear novas inteligências.";

/** Configuração visual por agente. IA 1 = verde; IA 2 e IA 3 = vermelho. */
function styleFor(slug: string, active: boolean) {
  if (active)
    return {
      variant: 1 as const,
      accent: "#34d399", // verde
      badge: "bg-[#34d399]/15 text-[#34d399]",
      // borda/sombra verde só no hover
      hover:
        "hover:border-[#34d399]/50 hover:shadow-[0_0_30px_-10px_rgba(52,211,153,0.55)]",
      // glow verde suave (não cobre o card inteiro)
      overlay:
        "radial-gradient(140px 140px at 26% 50%, rgba(52,211,153,0.22), transparent 70%)",
    };

  // IA 2 e IA 3 — mesmo padrão VERMELHO de bloqueio.
  return {
    variant: (slug === "ia-2" ? 2 : 3) as 2 | 3,
    accent: "#f87171", // vermelho
    badge: "bg-[#f87171]/15 text-[#f87171]",
    hover:
      "hover:border-[#f87171]/60 hover:shadow-[0_0_34px_-8px_rgba(248,113,113,0.6)]",
    // overlay vermelho que cobre o CARD INTEIRO no hover
    overlay:
      "linear-gradient(135deg, rgba(127,29,29,0.62) 0%, rgba(220,38,38,0.30) 45%, rgba(248,113,113,0.10) 100%)",
  };
}

export function AiCard({ agent }: { agent: AiAgent }) {
  const active = agent.active;
  const s = styleFor(agent.slug, active);
  const [toast, setToast] = useState(false);

  function showLocked() {
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  }

  return (
    <>
      <div
        className={cn(
          "group relative flex overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-4 transition-all duration-300 hover:-translate-y-1",
          s.hover
        )}
        style={{ minHeight: 180 }}
      >
        {/* Overlay de hover (verde sutil na IA 1; vermelho no card inteiro nas bloqueadas) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: s.overlay }}
        />

        {/* lado esquerdo: robô grande */}
        <div className="relative flex w-2/5 items-center justify-center">
          <Robot
            variant={s.variant}
            accent={s.accent}
            className="h-36 w-full max-w-[120px]"
          />
        </div>

        {/* lado direito: conteúdo */}
        <div className="relative flex w-3/5 flex-col pl-3">
          <div className="flex items-center justify-between">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", s.badge)}>
              {active ? "Liberada" : "Em breve"}
            </span>
            {!active && (
              <Lock className="h-4 w-4 text-[#f87171] transition-transform duration-300 group-hover:scale-125" />
            )}
          </div>

          <h3 className="mt-2 text-lg font-semibold">{agent.name}</h3>
          <p className="mt-1 line-clamp-3 text-xs text-muted">
            {agent.description}
          </p>

          <div className="mt-auto pt-3">
            {active ? (
              <Link
                href={`/ia/${agent.slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#34d399] px-3.5 py-2 text-sm font-medium text-black transition-transform group-hover:scale-[1.03]"
              >
                Acessar IA 1 <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={showLocked}
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm font-medium text-muted transition-colors group-hover:border-[#f87171]/50 group-hover:text-[#f87171]"
              >
                <Lock className="h-4 w-4" /> Bloqueada
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast ao tentar abrir IA bloqueada */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="flex items-start gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-2xl">
            <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
            <span className="max-w-xs">{LOCKED_MESSAGE}</span>
          </div>
        </div>
      )}
    </>
  );
}
