"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Lock, Shield } from "lucide-react";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

/**
 * Navegação mobile: barra superior com botão de menu + drawer lateral.
 * Sem hover/animações pesadas (regra do mobile).
 */
export function MobileNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Topbar mobile */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent" />
          <span className="font-semibold text-sm">{APP_NAME}</span>
        </div>
        <button
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-surface-2"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-surface border-r border-border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">{APP_NAME}</span>
              <button
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                      active
                        ? "bg-primary/15 text-foreground"
                        : "text-muted hover:bg-surface-2",
                      item.locked && "opacity-60"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.locked && <Lock className="h-3.5 w-3.5" />}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                    pathname.startsWith("/admin")
                      ? "bg-primary/15 text-foreground"
                      : "text-muted hover:bg-surface-2"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  <span className="flex-1">Admin</span>
                </Link>
              )}
            </nav>
            <div className="border-t border-border pt-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
