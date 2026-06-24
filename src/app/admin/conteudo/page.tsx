import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AddModuleForm,
  AddLessonForm,
  LessonEditor,
  CreateCourseForm,
} from "@/components/admin/content-forms";
import { requireAdmin } from "@/lib/admin";
import { formatBRL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata = { title: "Conteúdo — Admin" };

export default async function AdminConteudo({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: courseSlug } = await searchParams;
  const { admin } = await requireAdmin();

  const { data: courses } = await admin
    .from("courses")
    .select("id, slug, title, price_cents, is_published")
    .order("position", { ascending: true });

  const list = courses ?? [];
  const selected =
    list.find((c) => c.slug === courseSlug) ?? list[0] ?? null;

  const { data: modules } = selected
    ? await admin
        .from("course_modules")
        .select("id, title, position")
        .eq("course_id", selected.id)
        .order("position", { ascending: true })
    : { data: [] };

  const { data: lessons } = selected
    ? await admin
        .from("lessons")
        .select("id, module_id, title, video_embed, position")
        .order("position", { ascending: true })
    : { data: [] };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Conteúdo</h1>

      {/* Criar curso */}
      <Card>
        <CardTitle>Novo curso</CardTitle>
        <CardDescription className="mb-3">
          Crie um curso e defina o preço de venda (R$).
        </CardDescription>
        <CreateCourseForm />
      </Card>

      {/* Seletor de curso */}
      {list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/admin/conteudo?course=${c.slug}`}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm transition-colors",
                selected?.id === c.id
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border text-muted hover:bg-surface-2"
              )}
            >
              {c.title}
              <span className="ml-2 text-xs text-muted">
                {c.price_cents > 0 ? formatBRL(c.price_cents) : "grátis"}
              </span>
            </Link>
          ))}
        </div>
      )}

      {!selected ? (
        <Card>
          <CardDescription>Nenhum curso ainda. Crie o primeiro acima.</CardDescription>
        </Card>
      ) : (
        <>
          <Card>
            <CardTitle>Adicionar módulo em “{selected.title}”</CardTitle>
            <div className="mt-3">
              <AddModuleForm courseId={selected.id} />
            </div>
          </Card>

          {(modules ?? []).map((m) => (
            <Card key={m.id} className="space-y-3">
              <CardTitle>{m.title}</CardTitle>
              {(lessons ?? [])
                .filter((l) => l.module_id === m.id)
                .map((l) => (
                  <LessonEditor
                    key={l.id}
                    lessonId={l.id}
                    title={l.title}
                    embed={l.video_embed ?? ""}
                  />
                ))}
              <AddLessonForm moduleId={m.id} />
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
