"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLessonComplete } from "@/lib/actions/lessons";

export function CompleteButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !completed;
    setCompleted(next); // otimista
    startTransition(async () => {
      const res = await toggleLessonComplete(lessonId, next);
      if (!res.ok) setCompleted(!next); // reverte em caso de erro
    });
  }

  return (
    <Button
      variant={completed ? "outline" : "primary"}
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : completed ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Circle className="h-4 w-4" />
      )}
      {completed ? "Concluída" : "Marcar como concluída"}
    </Button>
  );
}
