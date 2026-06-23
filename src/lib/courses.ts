import { createClient } from "@/lib/supabase/server";
import type {
  Course,
  CourseModule,
  Lesson,
  ModuleWithLessons,
} from "@/lib/types";

/**
 * Carrega o curso principal do aluno com módulos, aulas e progresso.
 * RLS garante que só retorna dados se o aluno tiver matrícula ativa.
 * Retorna null se o aluno não tiver acesso a nenhum curso.
 */
export async function getCourseOverview(): Promise<{
  course: Course;
  modules: ModuleWithLessons[];
  totalLessons: number;
  completedLessons: number;
  nextLesson: { id: string; title: string } | null;
} | null> {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, description, cover_url")
    .order("created_at", { ascending: true })
    .limit(1);

  const course = courses?.[0] as Course | undefined;
  if (!course) return null;

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, course_id, title, description, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, module_id, title, description, video_embed, position, is_locked")
    .order("position", { ascending: true });

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed");

  const completedSet = new Set(
    (progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id)
  );

  const moduleList: ModuleWithLessons[] = (modules ?? []).map(
    (m: CourseModule) => ({
      ...m,
      lessons: ((lessons ?? []) as Lesson[])
        .filter((l) => l.module_id === m.id)
        .map((l) => ({ ...l, completed: completedSet.has(l.id) })),
    })
  );

  const allLessons = moduleList.flatMap((m) => m.lessons);
  const completedLessons = allLessons.filter((l) => l.completed).length;
  const nextLesson =
    allLessons.find((l) => !l.completed) ?? allLessons[0] ?? null;

  return {
    course,
    modules: moduleList,
    totalLessons: allLessons.length,
    completedLessons,
    nextLesson: nextLesson
      ? { id: nextLesson.id, title: nextLesson.title }
      : null,
  };
}

/** Lista plana e ordenada das aulas do curso (para navegação prev/next). */
export async function getLessonContext(lessonId: string) {
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, module_id, title, description, video_embed, position, is_locked")
    .eq("id", lessonId)
    .single();

  if (!lesson) return null;

  // Descobre o curso a partir do módulo.
  const { data: mod } = await supabase
    .from("course_modules")
    .select("id, course_id")
    .eq("id", lesson.module_id)
    .single();

  if (!mod) return null;

  // Todas as aulas do curso, em ordem (módulo, depois aula).
  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, position")
    .eq("course_id", mod.course_id)
    .order("position", { ascending: true });

  const moduleOrder = new Map(
    (modules ?? []).map((m, i) => [m.id, i] as const)
  );

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, module_id, title, position")
    .order("position", { ascending: true });

  const ordered = ((lessons ?? []) as Pick<
    Lesson,
    "id" | "module_id" | "title" | "position"
  >[])
    .filter((l) => moduleOrder.has(l.module_id))
    .sort((a, b) => {
      const ma = moduleOrder.get(a.module_id)!;
      const mb = moduleOrder.get(b.module_id)!;
      return ma !== mb ? ma - mb : a.position - b.position;
    });

  const index = ordered.findIndex((l) => l.id === lessonId);

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("completed")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  return {
    lesson: lesson as Lesson,
    courseId: mod.course_id,
    index,
    total: ordered.length,
    prev: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
    completed: progress?.completed ?? false,
  };
}
