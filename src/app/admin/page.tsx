import Link from "next/link";
import { Ticket, Users, ShoppingBag, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin — Trilogia do Sucesso" };

export default async function AdminHome() {
  const { admin } = await requireAdmin();

  const [openTickets, students, paidOrders, lessons] = await Promise.all([
    admin
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid"),
    admin.from("lessons").select("id", { count: "exact", head: true }),
  ]);

  const cards = [
    { label: "Chamados abertos", value: openTickets.count ?? 0, icon: Ticket, href: "/admin/chamados" },
    { label: "Alunos", value: students.count ?? 0, icon: Users, href: "/admin/alunos" },
    { label: "Pedidos pagos", value: paidOrders.count ?? 0, icon: ShoppingBag, href: "/admin/pagamentos" },
    { label: "Aulas", value: lessons.count ?? 0, icon: BookOpen, href: "/admin/conteudo" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Visão geral</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href}>
              <Card className="hover:bg-surface-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-2xl font-semibold">{c.value}</p>
                <p className="text-sm text-muted">{c.label}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
