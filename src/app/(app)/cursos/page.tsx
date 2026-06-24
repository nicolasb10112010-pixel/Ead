import Link from "next/link";
import { PlayCircle, Lock, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BuyCourseButton } from "@/components/courses/buy-course-button";
import { getCoursesForStore } from "@/lib/courses";
import { formatBRL } from "@/lib/constants";

export const metadata = { title: "Cursos — Trilogia do Sucesso" };

export default async function CursosPage() {
  const courses = await getCoursesForStore();
  const myCourses = courses.filter((c) => c.enrolled);
  const available = courses.filter((c) => !c.enrolled);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Cursos"
        subtitle="Acesse seus cursos e desbloqueie novos conteúdos."
      />

      {/* Meus cursos */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Meus cursos</h2>
        {myCourses.length === 0 ? (
          <Card>
            <CardDescription>
              Você ainda não tem nenhum curso liberado. Compre um abaixo para
              começar.
            </CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((c) => (
              <Card key={c.id} className="flex flex-col">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">{c.title}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">
                  {c.description}
                </CardDescription>
                <div className="flex-1" />
                <Link href={`/cursos/${c.slug}`} className="mt-4">
                  <Button className="w-full">
                    <PlayCircle className="h-4 w-4" /> Acessar
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Disponíveis para comprar */}
      {available.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Disponíveis</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((c) => (
              <Card key={c.id} className="flex flex-col">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4">{c.title}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">
                  {c.description}
                </CardDescription>
                <p className="mt-3 text-xl font-bold">
                  {c.price_cents > 0 ? formatBRL(c.price_cents) : "Gratuito"}
                </p>
                <div className="flex-1" />
                <div className="mt-4">
                  {c.price_cents > 0 ? (
                    <BuyCourseButton slug={c.slug} label="Comprar curso" />
                  ) : (
                    <Link href={`/cursos/${c.slug}`}>
                      <Button variant="outline" className="w-full">
                        Ver curso
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
