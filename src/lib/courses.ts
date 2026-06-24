import { createClient } from "@/lib/supabase/server";
import type {
  Course,
  CourseModule,
  Lesson,
  ModuleWithLessons,
} from "@/lib/types";

export type StoreCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  coverImageUrl: string | null;
  price_cents: number;
  enrolled: boolean;
  progressPct: number;
};

/** Catálogo: todos os cursos publicados + se o aluno já tem + progresso. */
export async function getCoursesForStore(): Promise<StoreCourse[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: courses } = await supabase
    .from("courses")
    .select(
      "id, slug, title, description, short_description, cover_image_url, price_cents, position"
    )
    .eq("is_published", true)
    .order("position", { ascending: true });

  const { data: enrolls } = await supabase
    .from("enrollments")
    .select("course_id, status")
    .eq("user_id", user.id);

  const enrolledSet = new Set(
    (enrolls ?? []).filter((e) => e.status === "active").map((e) => e.course_id)
  );
  const enrolledIds = [...enrolledSet];

  // Progresso por curso (só dos matriculados).
  const progress = new Map<string, { total: number; done: number }>();
  if (enrolledIds.length > 0) {
    const { data: mods } = await supabase
      .from("course_modules")
      .select("id, course_id")
      .in("course_id", enrolledIds);
    const modToCourse = new Map((mods ?? []).map((m) => [m.id, m.course_id]));
    const modIds = (mods ?? []).map((m) => m.id);

    if (modIds.length > 0) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, module_id")
        .in("module_id", modIds);
      const { data: prog } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed");
      const doneSet = new Set(
        (prog ?? []).filter((p) => p.completed).map((p) => p.lesson_id)
      );
      for (const l of lessons ?? []) {
        const cid = modToCourse.get(l.module_id);
        if (!cid) continue;
        const acc = progress.get(cid) ?? { total: 0, done: 0 };
        acc.total += 1;
        if (doneSet.has(l.id)) acc.done += 1;
        progress.set(cid, acc);
      }
    }
  }

  return (courses ?? []).map((c) => {
    const p = progress.get(c.id);
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      shortDescription: c.short_description,
      coverImageUrl: c.cover_image_url,
      price_cents: c.price_cents,
      enrolled: enrolledSet.has(c.id),
      progressPct: p && p.total ? Math.round((p.done / p.total) * 100) : 0,
    };
  });
}

/**
 * Detalhe de um curso pelo slug: info + se está matriculado + (se sim)
 * módulos/aulas com progresso. RLS só devolve aulas se houver matrícula.
 */
export async function getCourseDetail(slug: string): Promise<{
  course: StoreCourse;
  enrolled: boolean;
  modules: ModuleWithLessons[];
  totalLessons: number;
  completedLessons: number;
  nextLesson: { id: string; title: string } | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, slug, title, description, short_description, cover_image_url, price_cents"
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!course) return null;

  const { data: enr } = await supabase
    .from("enrollments")
    .select("status")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();
  const enrolled = enr?.status === "active";

  const storeCourse: StoreCourse = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    shortDescription: course.short_description,
    coverImageUrl: course.cover_image_url,
    price_cents: course.price_cents,
    enrolled,
    progressPct: 0,
  };

  if (!enrolled) {
    return {
      course: storeCourse,
      enrolled: false,
      modules: [],
      totalLessons: 0,
      completedLessons: 0,
      nextLesson: null,
    };
  }

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
  const nextLesson = allLessons.find((l) => !l.completed) ?? allLessons[0] ?? null;

  return {
    course: storeCourse,
    enrolled: true,
    modules: moduleList,
    totalLessons: allLessons.length,
    completedLessons,
    nextLesson: nextLesson
      ? { id: nextLesson.id, title: nextLesson.title }
      : null,
  };
}

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
