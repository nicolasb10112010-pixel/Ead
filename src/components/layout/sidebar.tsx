"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Shield } from "lucide-react";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

/** Menu lateral fixo — visível apenas no desktop (md+). */
export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-surface/60 backdrop-blur-md">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
        <span className="font-semibold tracking-tight">{APP_NAME}</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-disabled={item.locked}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-foreground"
                  : "text-muted hover:bg-surface-2 hover:text-foreground",
                item.locked && "opacity-60"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.locked && <Lock className="h-3.5 w-3.5" />}
              {item.badge && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "group mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              pathname.startsWith("/admin")
                ? "bg-primary/15 text-foreground"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span className="flex-1">Admin</span>
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <LogoutButton />
      </div>
    </aside>
  );
}
