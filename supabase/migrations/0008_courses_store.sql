-- ============================================================================
-- Trilogia do Sucesso — Migration 0008
-- Loja de cursos: preço por curso, catálogo público (published) e compra
-- que gera matrícula via webhook.
-- ============================================================================

-- Preço e ordenação dos cursos.
alter table public.courses
  add column if not exists price_cents int not null default 0,
  add column if not exists position int not null default 0;

update public.courses set position = 1
  where slug = 'trilogia-do-sucesso' and position = 0;

-- Catálogo: qualquer autenticado vê cursos PUBLICADOS (título/preço/capa).
-- O CONTEÚDO (módulos/aulas) continua restrito a quem tem matrícula ativa,
-- pois aquelas policies usam has_course_access().
drop policy if exists "courses_read_enrolled" on public.courses;
drop policy if exists "courses_read_catalog_or_enrolled" on public.courses;
create policy "courses_read_catalog_or_enrolled" on public.courses
  for select using (is_published or public.has_course_access(id));

-- Pedido pode ser de um curso (em vez de créditos).
alter table public.orders
  add column if not exists course_id uuid references public.courses (id);

-- ----------------------------------------------------------------------------
-- Cursos de exemplo (pagos, publicados) com conteúdo, para a loja não ficar vazia.
-- ----------------------------------------------------------------------------
insert into public.courses (slug, title, description, price_cents, position, is_published)
values
  ('marketing-essencial', 'Marketing Essencial',
   'Fundamentos de marketing para atrair e vender mais.', 9700, 2, true),
  ('mentalidade-milionaria', 'Mentalidade Milionária',
   'Hábitos e estratégias de alta performance.', 14700, 3, true)
on conflict (slug) do update
  set price_cents = excluded.price_cents,
      position = excluded.position,
      is_published = excluded.is_published;

do $$
declare c uuid; m uuid;
begin
  for c in
    select id from public.courses
    where slug in ('marketing-essencial', 'mentalidade-milionaria')
  loop
    if not exists (select 1 from public.course_modules where course_id = c) then
      insert into public.course_modules (course_id, title, position)
        values (c, 'Módulo 1 — Introdução', 1) returning id into m;
      insert into public.lessons (module_id, title, description, video_embed, position) values
        (m, 'Boas-vindas', 'Comece por aqui.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
        (m, 'Primeiros passos', 'Coloque em prática.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2);
    end if;
  end loop;
end $$;
