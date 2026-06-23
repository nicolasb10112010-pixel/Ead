"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Atualiza o nome do perfil do usuário logado. */
export async function updateFullName(fullName: string) {
  const name = fullName.trim();
  if (!name) return { ok: false, error: "Informe um nome." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/conta");
  revalidatePath("/inicio");
  return { ok: true };
}

/** Salva a URL pública do avatar (upload é feito no client, no Storage). */
export async function updateAvatarUrl(avatarUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/conta");
  return { ok: true };
}

/** Troca a senha do usuário logado. */
export async function changePassword(newPassword: string) {
  if (newPassword.length < 8)
    return { ok: false, error: "A senha deve ter pelo menos 8 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
