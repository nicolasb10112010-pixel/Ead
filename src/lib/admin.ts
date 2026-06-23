import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Confere se o usuário logado é admin. Retorna o client com SERVICE ROLE
 * (para operações privilegiadas) só depois de validar a sessão + role.
 * Lança se não for admin — use em server actions/admin pages.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("NOT_AUTHENTICATED");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") throw new Error("NOT_ADMIN");

  return { admin: createAdminClient(), userId: user.id };
}

/** Versão booleana, sem lançar — para decidir exibir o link de admin. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "admin";
}
