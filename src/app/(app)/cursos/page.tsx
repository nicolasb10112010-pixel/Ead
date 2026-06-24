import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription } from "@/components/ui/card";
import { CourseCard } from "@/components/courses/course-card";
import { getCoursesForStore } from "@/lib/courses";

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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>

      {/* Disponíveis para comprar */}
      {available.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Continue evoluindo</h2>
          <p className="mb-4 text-sm text-muted">
            Cursos disponíveis para adicionar à sua conta.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
