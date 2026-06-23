import {
  Home,
  PlayCircle,
  Bot,
  User,
  LifeBuoy,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export const APP_NAME = "Trilogia do Sucesso";

/** Checkout externo do botão "Comprar agora" (NÃO cria conta grátis). */
export const EXTERNAL_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "https://pay.exemplo.com/trilogia";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  locked?: boolean;
  badge?: string;
};

/** Menu lateral (desktop) e drawer/inferior (mobile). */
export const NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/inicio", icon: Home },
  { label: "Aulas", href: "/aulas", icon: PlayCircle },
  { label: "IA 1", href: "/ia/ia-1", icon: Bot },
  { label: "IA 2", href: "/ia/ia-2", icon: Bot, locked: true, badge: "Em breve" },
  { label: "IA 3", href: "/ia/ia-3", icon: Bot, locked: true, badge: "Em breve" },
  { label: "Sua conta", href: "/conta", icon: User },
  { label: "Suporte", href: "/suporte", icon: LifeBuoy },
  { label: "Comprar créditos", href: "/creditos", icon: CreditCard },
];

export type AiAgent = {
  slug: string;
  name: string;
  description: string;
  active: boolean;
};

export const AI_AGENTS: AiAgent[] = [
  {
    slug: "ia-1",
    name: "IA 1",
    description:
      "Sua assistente inteligente para aplicar o conteúdo da Trilogia do Sucesso.",
    active: true,
  },
  {
    slug: "ia-2",
    name: "IA 2",
    description: "Novo agente inteligente em desenvolvimento.",
    active: false,
  },
  {
    slug: "ia-3",
    name: "IA 3",
    description: "Novo agente inteligente em desenvolvimento.",
    active: false,
  },
];

export type Achievement = {
  slug: string;
  title: string;
  description: string;
};

/** Catálogo de conquistas (espelha a tabela achievements). */
export const ACHIEVEMENTS: Achievement[] = [
  { slug: "primeiro-passo", title: "Primeiro Passo", description: "Assistiu sua primeira aula." },
  { slug: "aluno-consistente", title: "Aluno Consistente", description: "Assistiu 5 aulas na plataforma." },
  { slug: "maratonista", title: "Maratonista", description: "Assistiu 10 aulas." },
  { slug: "mente-estrategica", title: "Mente Estratégica", description: "Usou a IA 1 pela primeira vez." },
  { slug: "explorador-inteligente", title: "Explorador Inteligente", description: "Fez 10 perguntas para a IA." },
  { slug: "executor", title: "Executor", description: "Concluiu um módulo inteiro." },
  { slug: "foco-total", title: "Foco Total", description: "Acessou a plataforma por 3 dias diferentes." },
  { slug: "aluno-avancado", title: "Aluno Avançado", description: "Concluiu 50% do curso." },
  { slug: "trilogia-completa", title: "Trilogia Completa", description: "Concluiu 100% das aulas disponíveis." },
];

export type CreditPackage = {
  slug: string;
  name: string;
  credits: number;
  priceCents: number;
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  { slug: "pacote-1000", name: "Pacote Inicial", credits: 1000, priceCents: 2990 },
  { slug: "pacote-3000", name: "Pacote Plus", credits: 3000, priceCents: 6990 },
  { slug: "pacote-10000", name: "Pacote Pro", credits: 10000, priceCents: 19990 },
];

/** Custo em créditos por tipo de mensagem da IA (usado na Fase 4). */
export const AI_CREDIT_COST = {
  text: 10,
  image: 30,
  file: 40,
} as const;

export const SUPPORT_CATEGORIES = [
  { value: "duvida_aula", label: "Dúvida sobre aula" },
  { value: "acesso", label: "Problema de acesso" },
  { value: "pagamento", label: "Problema com pagamento" },
  { value: "duvida_ia", label: "Dúvida sobre IA" },
  { value: "outro", label: "Outro" },
] as const;

export const TICKET_STATUS: Record<
  string,
  { label: string; className: string }
> = {
  open: { label: "Aberto", className: "bg-accent/15 text-accent" },
  answered: { label: "Respondido", className: "bg-primary/15 text-primary" },
  closed: { label: "Fechado", className: "bg-surface-2 text-muted" },
};

export function categoryLabel(value: string) {
  return (
    SUPPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value
  );
}

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
