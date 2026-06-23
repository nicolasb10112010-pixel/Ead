import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { isCurrentUserAdmin } from "@/lib/admin";
import { APP_NAME } from "@/lib/constants";
import { AdminNav } from "@/components/admin/admin-nav";

/**
 * Layout do painel admin. Fica FORA do grupo (app): tem navegação própria.
 * Bloqueia quem não é admin.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isCurrentUserAdmin();
  if (!admin) redirect("/inicio");

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 h-14">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">{APP_NAME} · Admin</span>
          </div>
          <Link
            href="/inicio"
            className="ml-auto flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao app
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <AdminNav />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
