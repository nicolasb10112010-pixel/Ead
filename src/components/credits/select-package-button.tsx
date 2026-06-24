"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/actions/cart";

export function SelectPackageButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(false);

  function handleClick() {
    setSelected(true); // feedback imediato de "selecionado"
    startTransition(async () => {
      const res = await addToCart(slug);
      if (res.ok) router.push("/carrinho");
      else setSelected(false);
    });
  }

  return (
    <Button className="mt-4 w-full" onClick={handleClick} disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : selected ? (
        <Check className="h-4 w-4" />
      ) : null}
      {selected ? "Selecionado" : "Selecionar"}
    </Button>
  );
}
