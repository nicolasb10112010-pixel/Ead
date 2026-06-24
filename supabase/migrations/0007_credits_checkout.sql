-- ============================================================================
-- Trilogia do Sucesso — Migration 0007
-- Créditos iniciais idempotentes, ledger enriquecido, order_items,
-- campos de payment_events e selo "Mais comprado".
-- ============================================================================

-- ----------------------------------------------------------------------------
-- credit_transactions: novos campos + tipos
-- ----------------------------------------------------------------------------
alter table public.credit_transactions
  add column if not exists balance_after int,
  add column if not exists description text,
  add column if not exists order_id uuid;

alter table public.credit_transactions
  drop constraint if exists credit_transactions_type_check;
alter table public.credit_transactions
  add constraint credit_transactions_type_check check (type in (
    'debit', 'purchase', 'refund', 'bonus', 'grant',
    'initial_grant', 'usage', 'adjustment'
  ));

-- ----------------------------------------------------------------------------
-- credit_packages: selo "Mais comprado"
-- ----------------------------------------------------------------------------
alter table public.credit_packages
  add column if not exists is_popular boolean not null default false;
update public.credit_packages set is_popular = true where slug = 'pacote-3000';

-- ----------------------------------------------------------------------------
-- payment_events: status/transaction_id/processed_at
-- ----------------------------------------------------------------------------
alter table public.payment_events
  add column if not exists status text not null default 'received',
  add column if not exists transaction_id text,
  add column if not exists processed_at timestamptz;

-- ----------------------------------------------------------------------------
-- ORDER_ITEMS (detalhe dos pedidos; marca upsell e item pai)
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  package_slug text not null references public.credit_packages (slug),
  credits int not null,
  price_cents int not null,
  is_upsell boolean not null default false,
  parent_item_id uuid references public.order_items (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.order_items enable row level security;
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );
drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o
            where o.id = order_id and o.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- FUNÇÕES DE CRÉDITO (reescritas para registrar balance_after/description)
-- ----------------------------------------------------------------------------

-- Débito da IA (uso). Atômico, retorna true se debitou.
create or replace function public.spend_credits(p_amount int, p_reason text default 'ia')
returns boolean language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_balance int; v_new int;
begin
  if v_user is null or p_amount <= 0 then return false; end if;
  insert into public.user_credits (user_id, balance) values (v_user, 0)
    on conflict (user_id) do nothing;
  select balance into v_balance from public.user_credits where user_id = v_user for update;
  if v_balance < p_amount then return false; end if;
  update public.user_credits set balance = balance - p_amount, updated_at = now()
    where user_id = v_user returning balance into v_new;
  insert into public.credit_transactions (user_id, amount, type, reason, balance_after, description)
    values (v_user, -p_amount, 'usage', p_reason, v_new, p_reason);
  return true;
end; $$;

-- Reembolso (IA falhou). Credita o usuário logado.
create or replace function public.refund_credits(p_amount int, p_reason text default 'refund')
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_new int;
begin
  if v_user is null or p_amount <= 0 then return; end if;
  insert into public.user_credits (user_id, balance) values (v_user, p_amount)
    on conflict (user_id) do update set balance = public.user_credits.balance + p_amount, updated_at = now()
    returning balance into v_new;
  insert into public.credit_transactions (user_id, amount, type, reason, balance_after, description)
    values (v_user, p_amount, 'refund', p_reason, v_new, p_reason);
end; $$;

-- Crédito por compra (webhook/admin). Idempotência é do chamador.
create or replace function public.add_credits_for(
  p_user_id uuid, p_amount int, p_type text default 'purchase',
  p_reason text default 'compra', p_order_id uuid default null
)
returns void language plpgsql security definer set search_path = public as $$
declare v_new int;
begin
  if p_user_id is null or p_amount <= 0 then return; end if;
  insert into public.user_credits (user_id, balance) values (p_user_id, p_amount)
    on conflict (user_id) do update set balance = public.user_credits.balance + p_amount, updated_at = now()
    returning balance into v_new;
  insert into public.credit_transactions (user_id, amount, type, reason, balance_after, description, order_id)
    values (p_user_id, p_amount, p_type, p_reason, v_new, p_reason, p_order_id);
end; $$;

-- Créditos iniciais de boas-vindas (500), idempotente.
create or replace function public.grant_initial_credits(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then return; end if;
  -- Só concede se o usuário ainda NÃO tem registro de saldo.
  if exists (select 1 from public.user_credits where user_id = p_user_id) then
    return;
  end if;
  insert into public.user_credits (user_id, balance) values (p_user_id, 500);
  insert into public.credit_transactions (user_id, amount, type, reason, balance_after, description)
    values (p_user_id, 500, 'initial_grant', 'boas-vindas', 500, 'Créditos iniciais de boas-vindas');
end; $$;

-- ----------------------------------------------------------------------------
-- Trigger de novo usuário: cria profile + concede 500 créditos iniciais.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  perform public.grant_initial_credits(new.id);
  return new;
end; $$;

-- Backfill: usuários existentes sem saldo recebem os 500 iniciais (1x).
insert into public.user_credits (user_id, balance)
select p.id, 500 from public.profiles p
where not exists (select 1 from public.user_credits uc where uc.user_id = p.id);

insert into public.credit_transactions (user_id, amount, type, reason, balance_after, description)
select p.id, 500, 'initial_grant', 'boas-vindas', 500, 'Créditos iniciais de boas-vindas'
from public.profiles p
where not exists (
  select 1 from public.credit_transactions t
  where t.user_id = p.id and t.type = 'initial_grant'
);
