"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminCreateModule,
  adminCreateLesson,
  adminUpdateLesson,
  adminCreateCourse,
} from "@/lib/actions/admin";

export function CreateCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nome do novo curso"
        className="flex-1 rounded-xl border border-border bg-surface-2 px-4 h-11 text-sm outline-none focus:ring-2 focus:ring-primary/60"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        type="number"
        placeholder="Preço R$ (ex: 97)"
        className="w-40 rounded-xl border border-border bg-surface-2 px-4 h-11 text-sm outline-none focus:ring-2 focus:ring-primary/60"
      />
      <Button
        disabled={pending || !title.trim()}
        onClick={() =>
          start(async () => {
            const reais = parseFloat(price.replace(",", ".")) || 0;
            const res = await adminCreateCourse({
              title,
              priceCents: Math.round(reais * 100),
            });
            setTitle("");
            setPrice("");
            if (res.ok && res.slug) router.push(`/admin/conteudo?course=${res.slug}`);
            else router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Criar curso
      </Button>
    </div>
  );
}

export function AddModuleForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Novo módulo"
        className="flex-1 rounded-xl border border-border bg-surface-2 px-4 h-11 text-sm outline-none focus:ring-2 focus:ring-primary/60"
      />
      <Button
        disabled={pending || !title.trim()}
        onClick={() =>
          start(async () => {
            await adminCreateModule(courseId, title);
            setTitle("");
            router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Módulo
      </Button>
    </div>
  );
}

export function AddLessonForm({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [embed, setEmbed] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título da aula"
        className="w-full rounded-lg border border-border bg-surface-2 px-3 h-10 text-sm outline-none"
      />
      <input
        value={embed}
        onChange={(e) => setEmbed(e.target.value)}
        placeholder="URL/embed do vídeo (Panda, VTurb, YouTube...)"
        className="w-full rounded-lg border border-border bg-surface-2 px-3 h-10 text-sm outline-none"
      />
      <Button
        size="sm"
        disabled={pending || !title.trim()}
        onClick={() =>
          start(async () => {
            await adminCreateLesson({ moduleId, title, videoEmbed: embed });
            setTitle("");
            setEmbed("");
            router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Adicionar aula
      </Button>
    </div>
  );
}

export function LessonEditor({
  lessonId,
  title,
  embed,
}: {
  lessonId: string;
  title: string;
  embed: string;
}) {
  const router = useRouter();
  const [t, setT] = useState(title);
  const [e, setE] = useState(embed);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface/60 p-3 sm:flex-row sm:items-center">
      <input
        value={t}
        onChange={(ev) => setT(ev.target.value)}
        className="flex-1 rounded-lg border border-border bg-surface-2 px-3 h-9 text-sm outline-none"
      />
      <input
        value={e}
        onChange={(ev) => setE(ev.target.value)}
        placeholder="embed do vídeo"
        className="flex-1 rounded-lg border border-border bg-surface-2 px-3 h-9 text-sm outline-none"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await adminUpdateLesson({ lessonId, title: t, videoEmbed: e });
            setSaved(true);
            router.refresh();
            setTimeout(() => setSaved(false), 2000);
          })
        }
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          "Salvo!"
        ) : (
          "Salvar"
        )}
      </Button>
    </div>
  );
}
