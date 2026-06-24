"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, Loader2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

type Status =
  | "idle"
  | "processing"
  | "approved"
  | "pending"
  | "rejected"
  | "canceled"
  | "error";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

// Garante que o SDK do Mercado Pago seja inicializado uma única vez.
let mpInitialized = false;

export function CreditsCheckout({
  orderId,
  amountCents,
}: {
  orderId: string;
  amountCents: number;
}) {
  const [status, setStatus] = useState<Status>("idle");

  if (status !== "idle") {
    return <PaymentState status={status} onRetry={() => setStatus("idle")} />;
  }

  // Sem Public Key → modo DEV/mock (aviso claro). Com Public Key → Brick real.
  return PUBLIC_KEY ? (
    <BrickCheckout orderId={orderId} amountCents={amountCents} setStatus={setStatus} />
  ) : (
    <DevCheckout orderId={orderId} setStatus={setStatus} />
  );
}

/* ---------- Estados de pagamento ---------- */
function PaymentState({
  status,
  onRetry,
}: {
  status: Status;
  onRetry: () => void;
}) {
  const map = {
    processing: {
      icon: Loader2,
      spin: true,
      color: "text-muted bg-surface-2",
      title: "Processando pagamento...",
      desc: "Aguarde um instante.",
    },
    approved: {
      icon: CheckCircle2,
      color: "text-success bg-success/15",
      title: "Pagamento aprovado!",
      desc: "Seus créditos foram adicionados à sua conta.",
    },
    pending: {
      icon: Clock,
      color: "text-warning bg-warning/15",
      title: "Pagamento pendente",
      desc: "Estamos aguardando a confirmação do pagamento. Seus créditos entram automaticamente assim que for aprovado.",
    },
    rejected: {
      icon: XCircle,
      color: "text-danger bg-danger/15",
      title: "Pagamento não aprovado",
      desc: "Pagamento não aprovado. Tente novamente ou escolha outro método.",
    },
    canceled: {
      icon: XCircle,
      color: "text-danger bg-danger/15",
      title: "Pagamento cancelado",
      desc: "Pagamento cancelado ou expirado.",
    },
    error: {
      icon: XCircle,
      color: "text-danger bg-danger/15",
      title: "Algo deu errado",
      desc: "Não foi possível concluir o pagamento. Tente novamente.",
    },
  } as const;

  const c = map[status as keyof typeof map] ?? map.error;
  const Icon = c.icon;

  return (
    <Card className="flex flex-col items-center py-10 text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.color}`}>
        <Icon className={`h-7 w-7 ${"spin" in c && c.spin ? "animate-spin" : ""}`} />
      </div>
      <CardTitle className="mt-4 text-xl">{c.title}</CardTitle>
      <CardDescription className="mt-2 max-w-sm">{c.desc}</CardDescription>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {status === "approved" ? (
          <>
            <Link href="/ia/ia-1">
              <Button>Ir para a IA 1</Button>
            </Link>
            <Link href="/inicio">
              <Button variant="outline">Início</Button>
            </Link>
          </>
        ) : status === "pending" ? (
          <Link href="/inicio">
            <Button variant="outline">Voltar ao início</Button>
          </Link>
        ) : status !== "processing" ? (
          <>
            <Button onClick={onRetry}>Tentar novamente</Button>
            <Link href="/creditos">
              <Button variant="outline">Ver pacotes</Button>
            </Link>
          </>
        ) : null}
      </div>
    </Card>
  );
}

/* ---------- Checkout real (Payment Brick) ---------- */
function BrickCheckout({
  orderId,
  amountCents,
  setStatus,
}: {
  orderId: string;
  amountCents: number;
  setStatus: (s: Status) => void;
}) {
  const [Brick, setBrick] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import("@mercadopago/sdk-react");
      // Inicializa o SDK apenas uma vez (evita reinit em HMR/re-render).
      if (!mpInitialized) {
        mod.initMercadoPago(PUBLIC_KEY, { locale: "pt-BR" });
        mpInitialized = true;
      }
      if (mounted)
        setBrick(() => mod.Payment as React.ComponentType<Record<string, unknown>>);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!Brick) {
    return (
      <Card className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </Card>
    );
  }

  return (
    <Card className="border-[#34d399]/40 bg-surface shadow-[0_0_30px_-10px_#34d399]">
      <Brick
        initialization={{ amount: Number((amountCents / 100).toFixed(2)) }}
        customization={{
          // Tema escuro + cores da Trilogia (verde neon nos destaques).
          visual: {
            style: {
              theme: "dark",
              customVariables: {
                baseColor: "#34d399",
                baseColorFirstVariant: "#22d3ee",
                formBackgroundColor: "#0f0f17",
                inputBackgroundColor: "#16161f",
                textPrimaryColor: "#ededf2",
                textSecondaryColor: "#8a8a99",
                outlinePrimaryColor: "#34d399",
                buttonTextColor: "#04130d",
                borderRadiusMedium: "12px",
                borderRadiusLarge: "16px",
              },
            },
          },
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            ticket: "all",
            bankTransfer: "all",
          },
        }}
        onSubmit={async ({ formData }: { formData: Record<string, unknown> }) => {
          setStatus("processing");
          try {
            const res = await fetch("/api/payments/credits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId, formData }),
            });
            const data = await res.json();
            const s = data.status as string;
            if (s === "approved") setStatus("approved");
            else if (s === "pending" || s === "in_process") setStatus("pending");
            else if (s === "rejected") setStatus("rejected");
            else setStatus("error");
          } catch {
            setStatus("error");
          }
        }}
        onError={() => setStatus("error")}
      />
    </Card>
  );
}

/* ---------- Checkout DEV/mock (sem Public Key) ---------- */
function DevCheckout({
  orderId,
  setStatus,
}: {
  orderId: string;
  setStatus: (s: Status) => void;
}) {
  async function simulate(outcome: "approved" | "rejected") {
    setStatus("processing");
    try {
      const res = await fetch("/api/payments/credits/dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, outcome }),
      });
      const data = await res.json();
      setStatus(data.status === "approved" ? "approved" : "rejected");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
        <FlaskConical className="mt-0.5 h-4 w-4 text-warning" />
        <div>
          <p className="font-medium text-warning">Modo de desenvolvimento</p>
          <p className="text-muted">
            A Public Key do Mercado Pago ainda não foi configurada
            (<code>NEXT_PUBLIC_MP_PUBLIC_KEY</code>). Use os botões abaixo para
            simular o pagamento e testar o fluxo. Em produção, aqui aparece o
            formulário de pagamento embarcado (Payment Brick).
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="flex-1" onClick={() => simulate("approved")}>
          Simular pagamento aprovado
        </Button>
        <Button variant="outline" onClick={() => simulate("rejected")}>
          Simular recusado
        </Button>
      </div>
    </Card>
  );
}
