"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeFromCart, clearCart, addToCart } from "@/lib/actions/cart";
import { createCreditOrder } from "@/lib/actions/checkout";

export function RemoveItemButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      aria-label="Remover item"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await removeFromCart(slug);
          router.refresh();
        })
      }
      className="text-muted hover:text-danger disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}

export function AddUpsellButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await addToCart(slug);
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      Adicionar oferta
    </Button>
  );
}

export function CheckoutButtons({
  blockedReason,
}: {
  /** Quando preenchido, a compra fica bloqueada com esta mensagem. */
  blockedReason?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function buy() {
    if (blockedReason) {
      setError(blockedReason);
      return;
    }
    setError(null);
    start(async () => {
      const res = await createCreditOrder();
      if (res.ok) {
        // Checkout INTERNO (sem sair da plataforma).
        router.push(`/carrinho/pagamento?order=${res.orderId}`);
      } else {
        setError(res.error);
      }
    });
  }

  function cancel() {
    start(async () => {
      await clearCart();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {(error || blockedReason) && (
        <p className="text-sm text-danger">{error ?? blockedReason}</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="h-14 flex-1 text-base font-semibold"
          onClick={buy}
          disabled={pending || !!blockedReason}
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
          Ir para pagamento
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 sm:w-40"
          onClick={cancel}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
