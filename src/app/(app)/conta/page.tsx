import { redirect } from "next/navigation";
import { Trophy, Coins, BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/account/profile-form";
import { getAccountData } from "@/lib/account";
import { ACHIEVEMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata = { title: "Sua conta — Trilogia do Sucesso" };

export default async function ContaPage() {
  const account = await getAccountData();
  if (!account) redirect("/login");

  const unlocked = new Set(account.unlockedSlugs);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sua conta"
        subtitle="Gerencie seu perfil e acompanhe suas conquistas."
      />

      {/* Plano + créditos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted">Créditos disponíveis</p>
            <p className="text-lg font-semibold">
              {account.credits.toLocaleString("pt-BR")}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BadgeCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted">Plano atual</p>
            <p className="text-lg font-semibold capitalize">{account.plan}</p>
          </div>
        </Card>
      </div>

      <ProfileForm
        userId={account.userId}
        email={account.email}
        initialName={account.fullName}
        initialAvatar={account.avatarUrl}
      />

      {/* Conquistas */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Conquistas{" "}
          <span className="text-sm font-normal text-muted">
            ({unlocked.size}/{ACHIEVEMENTS.length})
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.has(a.slug);
            return (
              <Card
                key={a.slug}
                className={cn(
                  "flex items-start gap-3",
                  !got && "opacity-50"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    got
                      ? "bg-warning/15 text-warning"
                      : "bg-surface-2 text-muted"
                  )}
                >
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted">{a.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
