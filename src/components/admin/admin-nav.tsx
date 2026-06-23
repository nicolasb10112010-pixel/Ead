"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Visão geral", exact: true },
  { href: "/admin/chamados", label: "Chamados" },
  { href: "/admin/alunos", label: "Alunos" },
  { href: "/admin/conteudo", label: "Conteúdo" },
  { href: "/admin/pagamentos", label: "Pagamentos" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-border bg-surface/60 p-1.5">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/15 text-foreground"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
