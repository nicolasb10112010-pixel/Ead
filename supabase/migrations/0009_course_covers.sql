-- ============================================================================
-- Trilogia do Sucesso — Migration 0009
-- Capa e descrição curta dos cursos + tipagem dos itens de pedido.
-- ============================================================================

alter table public.courses
  add column if not exists cover_image_url text,
  add column if not exists short_description text;

-- Diferencia item de pedido (crédito vs curso) — modelagem completa.
alter table public.order_items
  add column if not exists item_type text not null default 'credit_package',
  add column if not exists course_id uuid references public.courses (id);

-- Descrições curtas amigáveis para os cursos de exemplo.
update public.courses set short_description = 'Curso principal da plataforma.'
  where slug = 'trilogia-do-sucesso' and short_description is null;
update public.courses set short_description = 'Atraia e venda mais com fundamentos de marketing.'
  where slug = 'marketing-essencial' and short_description is null;
update public.courses set short_description = 'Hábitos e estratégias de alta performance.'
  where slug = 'mentalidade-milionaria' and short_description is null;
