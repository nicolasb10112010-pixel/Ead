import { createClient } from "@/lib/supabase/server";

export type AccountData = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  plan: string;
  credits: number;
  unlockedSlugs: string[];
};

/**
 * Carrega os dados da conta do usuário logado.
 * De passagem, registra a atividade do dia e recalcula as conquistas
 * (idempotente) para manter a gamificação atualizada.
 */
export async function getAccountData(): Promise<AccountData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Marca acesso de hoje + recalcula conquistas (não bloqueia se falhar).
  await supabase.rpc("track_daily_activity");
  await supabase.rpc("recompute_achievements");

  const [{ data: profile }, { data: credits }, { data: achievements }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url, plan")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("user_achievements")
        .select("achievement_slug")
        .eq("user_id", user.id),
    ]);

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName:
      profile?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "aluno",
    avatarUrl: profile?.avatar_url ?? null,
    plan: profile?.plan ?? "free",
    credits: credits?.balance ?? 0,
    unlockedSlugs: (achievements ?? []).map((a) => a.achievement_slug),
  };
}
