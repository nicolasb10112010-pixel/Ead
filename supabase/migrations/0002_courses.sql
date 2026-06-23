-- ============================================================================
-- Trilogia do Sucesso — Migration 0002 (Fase 2)
-- Cursos, módulos, aulas, matrículas, progresso e comentários.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- COURSES / MODULES / LESSONS
-- ----------------------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  cover_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules (id) on delete cascade,
  title text not null,
  description text,
  -- Vídeo NÃO é hospedado aqui: guardamos o código/URL de embed externo
  -- (Panda Video, VTurb, YouTube, custom). Renderização sanitizada no front.
  video_embed text,
  position int not null default 0,
  is_locked boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ENROLLMENTS (gate de acesso ao curso)
-- ----------------------------------------------------------------------------
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'expired', 'canceled')),
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- Helper: o usuário atual tem matrícula ativa no curso?
create or replace function public.has_course_access(p_course_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments
    where user_id = auth.uid()
      and course_id = p_course_id
      and status = 'active'
  ) or public.is_admin();
$$;

-- ----------------------------------------------------------------------------
-- PROGRESS / COMMENTS
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_comments enable row level security;

-- Curso/módulo/aula: só quem tem matrícula ativa (ou admin) enxerga.
drop policy if exists "courses_read_enrolled" on public.courses;
create policy "courses_read_enrolled" on public.courses
  for select using (public.has_course_access(id));

drop policy if exists "modules_read_enrolled" on public.course_modules;
create policy "modules_read_enrolled" on public.course_modules
  for select using (public.has_course_access(course_id));

drop policy if exists "lessons_read_enrolled" on public.lessons;
create policy "lessons_read_enrolled" on public.lessons
  for select using (
    public.has_course_access(
      (select cm.course_id from public.course_modules cm where cm.id = module_id)
    )
  );

-- Matrículas: aluno vê as próprias; admin vê todas.
drop policy if exists "enrollments_read_own" on public.enrollments;
create policy "enrollments_read_own" on public.enrollments
  for select using (user_id = auth.uid() or public.is_admin());

-- Progresso: aluno gerencia só o próprio.
drop policy if exists "progress_select_own" on public.lesson_progress;
create policy "progress_select_own" on public.lesson_progress
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "progress_insert_own" on public.lesson_progress;
create policy "progress_insert_own" on public.lesson_progress
  for insert with check (user_id = auth.uid());

drop policy if exists "progress_update_own" on public.lesson_progress;
create policy "progress_update_own" on public.lesson_progress
  for update using (user_id = auth.uid());

-- Comentários: lê quem tem acesso à aula; escreve só o próprio.
drop policy if exists "comments_read_enrolled" on public.lesson_comments;
create policy "comments_read_enrolled" on public.lesson_comments
  for select using (
    public.has_course_access(
      (select cm.course_id
         from public.lessons l
         join public.course_modules cm on cm.id = l.module_id
        where l.id = lesson_id)
    )
  );

drop policy if exists "comments_insert_own" on public.lesson_comments;
create policy "comments_insert_own" on public.lesson_comments
  for insert with check (user_id = auth.uid());

drop policy if exists "comments_delete_own_or_admin" on public.lesson_comments;
create policy "comments_delete_own_or_admin" on public.lesson_comments
  for delete using (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- CONTEÚDO DE EXEMPLO (curso demo p/ você testar a UI)
-- ----------------------------------------------------------------------------
insert into public.courses (slug, title, description)
values ('trilogia-do-sucesso', 'Trilogia do Sucesso', 'Curso principal da plataforma.')
on conflict (slug) do nothing;

do $$
declare
  v_course uuid;
  v_mod1 uuid;
  v_mod2 uuid;
begin
  select id into v_course from public.courses where slug = 'trilogia-do-sucesso';

  -- Evita duplicar se rodar de novo
  if not exists (select 1 from public.course_modules where course_id = v_course) then
    insert into public.course_modules (course_id, title, description, position)
    values (v_course, 'Módulo 1 — Fundamentos', 'Comece por aqui.', 1)
    returning id into v_mod1;

    insert into public.course_modules (course_id, title, description, position)
    values (v_course, 'Módulo 2 — Estratégia', 'Aprofunde seus resultados.', 2)
    returning id into v_mod2;

    insert into public.lessons (module_id, title, description, video_embed, position) values
      (v_mod1, 'Boas-vindas', 'Apresentação da plataforma.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
      (v_mod1, 'Como estudar', 'Defina sua rotina de estudos.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
      (v_mod2, 'Planejamento', 'Monte seu plano de ação.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
      (v_mod2, 'Execução', 'Coloque em prática.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2);
  end if;
end $$;
