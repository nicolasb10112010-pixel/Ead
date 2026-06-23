"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  updateFullName,
  updateAvatarUrl,
  changePassword,
} from "@/lib/actions/account";

export function ProfileForm({
  userId,
  email,
  initialName,
  initialAvatar,
}: {
  userId: string;
  email: string;
  initialName: string;
  initialAvatar: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      flash("err", "Selecione uma imagem.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    // Pasta = userId (exigido pela policy de Storage).
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) {
      flash("err", "Falha no upload da imagem.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const res = await updateAvatarUrl(data.publicUrl);
    if (res.ok) {
      setAvatar(data.publicUrl);
      flash("ok", "Foto atualizada!");
      router.refresh();
    } else {
      flash("err", res.error ?? "Erro ao salvar a foto.");
    }
    setUploading(false);
  }

  function handleName(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateFullName(name);
      if (res.ok) {
        flash("ok", "Nome atualizado!");
        router.refresh();
      } else flash("err", res.error ?? "Erro.");
    });
  }

  function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await changePassword(password);
      if (res.ok) {
        setPassword("");
        flash("ok", "Senha alterada!");
      } else flash("err", res.error ?? "Erro.");
    });
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            msg.type === "ok"
              ? "bg-success/15 text-success"
              : "bg-danger/15 text-danger"
          }`}
        >
          {msg.text}
        </div>
      )}

      <Card>
        <CardTitle>Perfil</CardTitle>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-surface-2">
              {avatar ? (
                <Image
                  src={avatar}
                  alt="Foto de perfil"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted">
                  <User className="h-8 w-8" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
              aria-label="Trocar foto"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
            />
          </div>
          <div className="text-sm text-muted">
            Clique no ícone para trocar sua foto de perfil.
          </div>
        </div>

        <form onSubmit={handleName} className="mt-6 space-y-3">
          <div>
            <label className="text-sm text-muted">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-4 h-11 text-sm outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
          <div>
            <label className="text-sm text-muted">E-mail</label>
            <input
              value={email}
              disabled
              className="mt-1 w-full rounded-xl border border-border bg-surface-2/50 px-4 h-11 text-sm text-muted"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar nome
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Trocar senha</CardTitle>
        <form onSubmit={handlePassword} className="mt-4 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha (mín. 8 caracteres)"
            className="w-full rounded-xl border border-border bg-surface-2 px-4 h-11 text-sm outline-none focus:ring-2 focus:ring-primary/60"
          />
          <Button type="submit" variant="outline" disabled={pending || !password}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Atualizar senha
          </Button>
        </form>
      </Card>
    </div>
  );
}
