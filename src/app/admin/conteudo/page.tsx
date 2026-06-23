import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AddModuleForm,
  AddLessonForm,
  LessonEditor,
} from "@/components/admin/content-forms";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Conteúdo — Admin" };

export default async function AdminConteudo() {
  const { admin } = await requireAdmin();

  const { data: course } = await admin
    .from("courses")
    .select("id, title")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!course) {
    return (
      <Card>
        <CardTitle>Nenhum curso</CardTitle>
        <CardDescription>Crie o curso principal pela migration 0002.</CardDescription>
      </Card>
    );
  }

  const { data: modules } = await admin
    .from("course_modules")
    .select("id, title, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  const { data: lessons } = await admin
    .from("lessons")
    .select("id, module_id, title, video_embed, position")
    .order("position", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Conteúdo · {course.title}</h1>
      </div>

      <Card>
        <CardTitle>Adicionar módulo</CardTitle>
        <div className="mt-3">
          <AddModuleForm courseId={course.id} />
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
    </div>
  );
}
