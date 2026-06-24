import { redirect } from "next/navigation";

// "Aulas" virou "Cursos" (loja + meus cursos). Mantemos a rota antiga
// redirecionando para não quebrar links existentes.
export default function AulasPage() {
  redirect("/cursos");
}
