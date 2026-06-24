/**
 * Cria (ou reaproveita) um usuário ADMIN da plataforma.
 *
 * Uso (na raiz do projeto):
 *   node --env-file=.env.local scripts/seed-admin.mjs
 *   node --env-file=.env.local scripts/seed-admin.mjs admin@trilogia.com minhaSenha123 "Nome Admin"
 *
 * Requer SUPABASE_SERVICE_ROLE_KEY no .env.local (ignora RLS — só servidor).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const email = process.argv[2] ?? "admin@trilogia.com";
const password = process.argv[3] ?? "admin12345";
const fullName = process.argv[4] ?? "Administrador";

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Cria (ou localiza) o usuário no Auth, já confirmado.
  let userId;
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    if (error.message?.toLowerCase().includes("already")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      userId = list.users.find((u) => u.email === email)?.id;
      console.log("Usuário já existia, reutilizando:", email);
    } else {
      throw error;
    }
  } else {
    userId = created.user.id;
    console.log("Usuário criado:", email);
  }
  if (!userId) throw new Error("Não foi possível obter o ID do usuário.");

  // 2. Promove a ADMIN.
  const { error: upErr } = await supabase
    .from("profiles")
    .update({ role: "admin", full_name: fullName })
    .eq("id", userId);
  if (upErr) throw upErr;

  // 3. (Opcional) matricula no curso principal para conseguir pré-visualizar.
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "trilogia-do-sucesso")
    .maybeSingle();
  if (course) {
    await supabase
      .from("enrollments")
      .upsert(
        { user_id: userId, course_id: course.id, status: "active" },
        { onConflict: "user_id,course_id" }
      );
  }

  console.log("\n✅ Admin pronto! Faça login com:");
  console.log("   E-mail:", email);
  console.log("   Senha :", password);
  console.log("   Papel : admin");
}

main().catch((e) => {
  console.error("Erro no seed admin:", e.message ?? e);
  process.exit(1);
});
