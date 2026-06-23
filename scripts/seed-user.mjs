/**
 * Cria um usuário de teste JÁ matriculado no curso principal, para você
 * conseguir logar e ver as aulas durante o desenvolvimento.
 *
 * Uso (na raiz do projeto):
 *   node --env-file=.env.local scripts/seed-user.mjs
 *   node --env-file=.env.local scripts/seed-user.mjs aluno@teste.com minhaSenha123 "Nome do Aluno"
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

const email = process.argv[2] ?? "aluno@teste.com";
const password = process.argv[3] ?? "trilogia123";
const fullName = process.argv[4] ?? "Aluno de Teste";

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Cria (ou reaproveita) o usuário no Auth, já confirmado.
  let userId;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr) {
    if (createErr.message?.toLowerCase().includes("already")) {
      // Usuário já existe: localiza pelo e-mail.
      const { data: list } = await supabase.auth.admin.listUsers();
      userId = list.users.find((u) => u.email === email)?.id;
      console.log("Usuário já existia, reutilizando:", email);
    } else {
      throw createErr;
    }
  } else {
    userId = created.user.id;
    console.log("Usuário criado:", email);
  }

  if (!userId) throw new Error("Não foi possível obter o ID do usuário.");

  // 2. Localiza o curso principal.
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "trilogia-do-sucesso")
    .single();

  if (!course) {
    throw new Error("Curso 'trilogia-do-sucesso' não encontrado. Rode a migration 0002 primeiro.");
  }

  // 3. Matrícula ativa.
  await supabase
    .from("enrollments")
    .upsert(
      { user_id: userId, course_id: course.id, status: "active" },
      { onConflict: "user_id,course_id" }
    );

  // 4. Saldo inicial de créditos (para testar a IA na Fase 4).
  await supabase
    .from("user_credits")
    .upsert({ user_id: userId, balance: 500 }, { onConflict: "user_id" });

  console.log("\n✅ Pronto! Faça login com:");
  console.log("   E-mail:", email);
  console.log("   Senha :", password);
}

main().catch((e) => {
  console.error("Erro no seed:", e.message ?? e);
  process.exit(1);
});
