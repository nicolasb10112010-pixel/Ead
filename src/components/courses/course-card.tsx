import Link from "next/link";
import Image from "next/image";
import { Lock, ShoppingCart, PlayCircle, GraduationCap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/lessons/progress-bar";
import { BuyCourseButton } from "@/components/courses/buy-course-button";
import { formatBRL } from "@/lib/constants";
import type { StoreCourse } from "@/lib/courses";

/**
 * Card de curso reutilizável (Início, Cursos, Comprar Créditos, detalhe).
 * - Comprado: capa nítida, selo "Liberado", progresso e "Acessar curso".
 * - Não comprado: capa borrada + overlay escuro + carrinho/cadeado + preço
 *   e botão "Comprar agora". No hover (desktop) o blur diminui.
 * - Sem cover_image_url: placeholder em degradê (a imagem aparece sozinha
 *   quando o admin definir a URL).
 */
export function CourseCard({ course }: { course: StoreCourse }) {
  const locked = !course.enrolled;
  const desc = course.shortDescription ?? course.description ?? "";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_0_34px_-12px_var(--primary)]">
      {/* Capa */}
      <div className="relative aspect-video w-full overflow-hidden">
        {course.coverImageUrl ? (
          <Image
            src={course.coverImageUrl}
            alt={course.title}
            fill
            unoptimized
            className={`object-cover transition-all duration-700 group-hover:scale-105 ${
              locked ? "blur-sm group-hover:blur-[2px]" : ""
            }`}
          />
        ) : (
          // Placeholder bonito enquanto não há imagem real.
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-surface-2 to-accent/20 transition-all duration-700 ${
              locked ? "blur-[1px]" : ""
            }`}
          >
            <GraduationCap className="h-12 w-12 text-foreground/40" />
          </div>
        )}

        {/* Overlay de bloqueio (não comprado) */}
        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-center transition-colors duration-500 group-hover:bg-black/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="mt-1 text-sm font-medium text-white">Compre agora</span>
            {course.price_cents > 0 && (
              <span className="text-lg font-bold text-white">
                {formatBRL(course.price_cents)}
              </span>
            )}
          </div>
        )}

        {/* Selo de status */}
        <div className="absolute left-3 top-3">
          {locked ? (
            <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
              <Lock className="h-3 w-3" /> Bloqueado
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-success/20 px-2.5 py-1 text-[11px] text-success backdrop-blur-sm">
              <CheckCircle2 className="h-3 w-3" /> Liberado
            </span>
          )}
        </div>
      </div>

      {/* Corpo */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold">{course.title}</h3>
        {desc && <p className="mt-1 line-clamp-2 text-xs text-muted">{desc}</p>}

        {/* Progresso (comprado) */}
        {!locked && course.progressPct > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>Progresso</span>
              <span>{course.progressPct}%</span>
            </div>
            <ProgressBar value={course.progressPct} />
          </div>
        )}

        <div className="flex-1" />

        {/* Ação */}
        <div className="mt-4">
          {locked ? (
            course.price_cents > 0 ? (
              <BuyCourseButton slug={course.slug} label="Comprar agora" />
            ) : (
              <Link href={`/cursos/${course.slug}`}>
                <Button variant="outline" className="w-full">
                  Ver curso
                </Button>
              </Link>
            )
          ) : (
            <Link href={`/cursos/${course.slug}`}>
              <Button className="w-full transition-transform group-hover:scale-[1.02]">
                <PlayCircle className="h-4 w-4" /> Acessar curso
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
