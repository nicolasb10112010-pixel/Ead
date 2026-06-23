"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminGrantCredits, adminSetEnrollment } from "@/lib/actions/admin";

export function AdminStudentRow({
  userId,
  courseId,
  name,
  email,
  credits,
  enrolled,
}: {
  userId: string;
  courseId: string | null;
  name: string;
  email: string;
  credits: number;
  enrolled: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();

  function grant() {
    const n = parseInt(amount, 10);
    if (!n) return;
    start(async () => {
      await adminGrantCredits(userId, n);
      setAmount("");
      router.refresh();
    });
  }

  function toggleEnroll() {
    if (!courseId) return;
    start(async () => {
      await adminSetEnrollment(userId, courseId, !enrolled);
      router.refresh();
    });
  }

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-3">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted">{email}</p>
      </td>
      <td className="px-3 py-3 text-sm">{credits.toLocaleString("pt-BR")}</td>
      <td className="px-3 py-3">
        <button
          onClick={toggleEnroll}
          disabled={pending || !courseId}
          className={`rounded-full px-2.5 py-1 text-[11px] ${
            enrolled
              ? "bg-success/15 text-success"
              : "bg-surface-2 text-muted"
          }`}
        >
          {enrolled ? "Ativa" : "Inativa"}
        </button>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="qtd"
            className="w-20 rounded-lg border border-border bg-surface-2 px-2 h-9 text-sm outline-none"
          />
          <Button size="sm" variant="outline" onClick={grant} disabled={pending || !amount}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Creditar"}
          </Button>
        </div>
      </td>
    </tr>
  );
}
