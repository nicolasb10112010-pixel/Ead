"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCourseOrder } from "@/lib/actions/checkout";

export function BuyCourseButton({
  slug,
  label = "Comprar",
  size = "md",
  className,
}: {
  slug: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function buy() {
    setError(null);
    start(async () => {
      const res = await createCourseOrder(slug);
      if (res.ok) router.push(`/carrinho/pagamento?order=${res.orderId}`);
      else setError(res.error);
    });
  }

  return (
    <div className={className}>
      <Button size={size} className="w-full" onClick={buy} disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {label}
      </Button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
