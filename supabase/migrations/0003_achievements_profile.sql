-- ============================================================================
-- Trilogia do Sucesso — Migration 0003 (Fase 3)
-- Conquistas do usuário, engine de desbloqueio, atividade diária e
-- bucket de avatares (Storage).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- USER ACHIEVEMENTS
-- ----------------------------------------------------------------------------
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_slug text not null references public.achievements (slug) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_slug)
);

alter table public.user_achievements enable row level security;

drop policy if exists "user_achievements_read_own" on public.user_achievements;
create policy "user_achievements_read_own" on public.user_achievements
  for select using (user_id = auth.uid() or public.is_admin());
-- Inserção só via função recompute_achievements() (security definer).

-- ----------------------------------------------------------------------------
-- ATIVIDADE DIÁRIA (para a conquista "Foco Total" — 3 dias diferentes)
-- ----------------------------------------------------------------------------
create table if not exists public.user_daily_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

alter table public.user_daily_activity enable row level security;

drop policy if exists "daily_activity_read_own" on public.user_daily_activity;
create policy "daily_activity_read_own" on public.user_daily_activity
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "daily_activity_insert_own" on public.user_daily_activity;
create policy "daily_activity_insert_own" on public.user_daily_activity
  for insert with check (user_id = auth.uid());

-- Registra o acesso de hoje (idempotente).
create or replace function public.track_daily_activity()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.user_daily_activity (user_id, day)
  values (auth.uid(), current_date)
  on conflict do nothing;
end;
$$;

-- ----------------------------------------------------------------------------
-- ENGINE DE CONQUISTAS
-- Recalcula e concede as conquistas elegíveis do usuário logado.
-- Idempotente (on conflict do nothing). Chamada após eventos relevantes.
-- ----------------------------------------------------------------------------
create or replace function public.recompute_achievements()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_completed int;
  v_total int;
  v_full_module boolean;
  v_distinct_days int;
  v_ai_msgs int := 0;
  v_used_ia1 boolean := false;
begin
  if v_user is null then return; end if;

  select count(*) into v_completed
    from public.lesson_progress where user_id = v_user and completed;

  select count(*) into v_total from public.lessons;

  -- Algum módulo 100% concluído?
  select exists (
    select 1 from public.course_modules cm
    where (select count(*) from public.lessons l where l.module_id = cm.id) > 0
      and (select count(*) from public.lessons l where l.module_id = cm.id) =
          (select count(*) from public.lessons l
             join public.lesson_progress lp on lp.lesson_id = l.id
            where l.module_id = cm.id and lp.user_id = v_user and lp.completed)
  ) into v_full_module;

  select count(*) into v_distinct_days
    from public.user_daily_activity where user_id = v_user;

  -- Uso da IA (tabela só existe a partir da Fase 4 — protegido).
  if to_regclass('public.ai_messages') is not null then
    execute 'select count(*) from public.ai_messages m
               join public.ai_conversations c on c.id = m.conversation_id
              where c.user_id = $1 and m.role = $2'
      into v_ai_msgs using v_user, 'user';
    v_used_ia1 := v_ai_msgs > 0;
  end if;

  -- Concessões (each: só insere se ainda não tiver)
  if v_completed >= 1 then
    insert into public.user_achievements (user_id, achievement_slug)
      values (v_user, 'primeiro-passo') on conflict do nothing;
  end if;
  if v_completed >= 5 then
    insert into public.user_achievements (user_id, achievement_slug)
      values (v_user, 'aluno-consistente') on conflict do nothing;
  end if;
  if v_completed >= 10 then
    insert into public.user_achievements (user_id, achievement_slug)
      values (v_user, 'maratonista') on conflict do nothing;
  end if;
  if v_full_module then
    insert into public.user_achievements (user_id, achievement_slug)
      values (v_user, 'executor') on conflict do nothing;
  end if;
  if v_distinct_days >= 3 then
    insert into public.user_achievements (user_id, achievement_slug)
      values (v_user, 'foco-total') on conflict do nothing;
  end if;
  if v_total > 0 and v_completed::numeric / v_total >= 0.5 then
    insert into public.user_achievements (user_id, achievement_slug)
      values (v_user, 'aluno-avancado') on conflict do nothing;
  end if;
  if v_total > 0 and v_completed >= v_total then
    insert into public.user_achievements (user_id, achievement_slug)
      values (v_user, 'trilogia-completa') on conflict do nothing;
  end if;
  if v_used_ia1 then
    insert into public.user_achievements (user_id, achievement_slug)
      values (v_user, 'mente-estrategica') on conflict do nothing;
  end if;
  if v_ai_msgs >= 10 then
    insert into public.user_achievements (user_id, achievement_slug)
      values (v_user, 'explorador-inteligente') on conflict do nothing;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- STORAGE: bucket de avatares (público para leitura)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Leitura pública das imagens do bucket.
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Cada usuário só envia/edita/apaga arquivos dentro da pasta com o próprio id
-- (ex.: avatars/<uid>/foto.png).
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
