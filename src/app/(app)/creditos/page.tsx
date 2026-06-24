import { Zap, Coins, Star } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectPackageButton } from "@/components/credits/select-package-button";
import { CREDIT_PACKAGES, formatBRL } from "@/lib/constants";
import { getAccountData } from "@/lib/account";
import { cn } from "@/lib/utils";

export const metadata = { title: "Comprar créditos — Trilogia do Sucesso" };

export default async function CreditosPage() {
  const account = await getAccountData();
  const credits = account?.credits ?? 0;

  return (
    <div>
      <PageHeader
        title="Comprar créditos"
        subtitle="Escolha um pacote para usar nas suas IAs."
      />

      {/* Saldo atual no topo */}
      <Card className="mb-6 flex items-center gap-3 border-accent/30 bg-gradient-to-r from-accent/10 to-transparent">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Zap className="h-5 w-5" />
        </div>
        <p className="text-sm">
          Você tem{" "}
          <span className="text-lg font-bold text-accent">
            {credits.toLocaleString("pt-BR")}
          </span>{" "}
          créditos disponíveis.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CREDIT_PACKAGES.map((pkg) => (
          <Card
            key={pkg.slug}
            className={cn(
              "relative flex flex-col transition-all duration-300 hover:-translate-y-1.5",
              pkg.isPopular
                ? "border-primary/50 ring-1 ring-primary/40 hover:ring-primary/70 hover:shadow-[0_0_30px_-10px_var(--primary)]"
                : "hover:border-border hover:shadow-[0_0_24px_-12px_var(--accent)]"
            )}
          >
            {pkg.isPopular && (
              <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground shadow-lg">
                <Star className="h-3 w-3" /> Mais comprado
              </span>
            )}
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Coins className="h-5 w-5" />
            </div>
            <CardTitle className="mt-4">{pkg.name}</CardTitle>
            <p className="mt-1 text-2xl font-semibold">
              {pkg.credits.toLocaleString("pt-BR")}{" "}
              <span className="text-sm font-normal text-muted">créditos</span>
            </p>
            <p className="mt-1 text-sm text-muted">{formatBRL(pkg.priceCents)}</p>
            <div className="flex-1" />
            <SelectPackageButton slug={pkg.slug} />
          </Card>
        ))}
      </div>
    </div>
  );
}
