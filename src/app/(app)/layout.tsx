import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

/**
 * Layout das páginas internas — inclui o menu lateral (desktop) e o
 * drawer (mobile). A página da AULA fica FORA deste grupo, pois lá o menu
 * é removido para dar foco ao vídeo.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defesa em profundidade (o middleware já protege, mas garantimos aqui).
  if (!user) redirect("/login");

  const admin = await isCurrentUserAdmin();

  return (
    <div className="min-h-screen">
      <Sidebar isAdmin={admin} />
      <MobileNav isAdmin={admin} />
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
