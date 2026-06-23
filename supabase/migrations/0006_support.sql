-- ============================================================================
-- Trilogia do Sucesso — Migration 0006 (Fase 6)
-- Suporte (chamados + respostas) e bucket de anexos.
-- O painel admin reusa as policies de admin (is_admin()) já existentes.
-- ============================================================================

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  category text not null check (category in (
    'duvida_aula', 'acesso', 'pagamento', 'duvida_ia', 'outro'
  )),
  message text not null,
  attachment_url text,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;
alter table public.support_replies enable row level security;

-- Chamados: aluno vê/gerencia os próprios; admin vê todos.
drop policy if exists "tickets_select_own" on public.support_tickets;
create policy "tickets_select_own" on public.support_tickets
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "tickets_insert_own" on public.support_tickets;
create policy "tickets_insert_own" on public.support_tickets
  for insert with check (user_id = auth.uid());
drop policy if exists "tickets_update_own_or_admin" on public.support_tickets;
create policy "tickets_update_own_or_admin" on public.support_tickets
  for update using (user_id = auth.uid() or public.is_admin());

-- Respostas: visíveis se o chamado for do aluno (ou admin).
drop policy if exists "replies_select_own_or_admin" on public.support_replies;
create policy "replies_select_own_or_admin" on public.support_replies
  for select using (
    exists (select 1 from public.support_tickets t
            where t.id = ticket_id
              and (t.user_id = auth.uid() or public.is_admin()))
  );
-- Inserção: o aluno responde no próprio chamado; admin via service role.
drop policy if exists "replies_insert_own" on public.support_replies;
create policy "replies_insert_own" on public.support_replies
  for insert with check (
    author_id = auth.uid()
    and exists (select 1 from public.support_tickets t
                where t.id = ticket_id and t.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- STORAGE: anexos de suporte (público para leitura; pasta por usuário)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('support', 'support', true)
on conflict (id) do nothing;

drop policy if exists "support_public_read" on storage.objects;
create policy "support_public_read" on storage.objects
  for select using (bucket_id = 'support');

drop policy if exists "support_insert_own" on storage.objects;
create policy "support_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'support'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
