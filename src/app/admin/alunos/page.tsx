import { Card } from "@/components/ui/card";
import { AdminStudentRow } from "@/components/admin/admin-student-row";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Alunos — Admin" };

export default async function AdminAlunos() {
  const { admin } = await requireAdmin();

  // Curso principal (para a matrícula).
  const { data: course } = await admin
    .from("courses")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const courseId = course?.id ?? null;

  const [{ data: profiles }, { data: credits }, { data: enrollments }, usersRes] =
    await Promise.all([
      admin.from("profiles").select("id, full_name, plan"),
      admin.from("user_credits").select("user_id, balance"),
      courseId
        ? admin
            .from("enrollments")
            .select("user_id, status")
            .eq("course_id", courseId)
        : Promise.resolve({ data: [] as { user_id: string; status: string }[] }),
      admin.auth.admin.listUsers(),
    ]);

  const creditMap = new Map(
    (credits ?? []).map((c) => [c.user_id, c.balance])
  );
  const enrollMap = new Map(
    (enrollments ?? []).map((e) => [e.user_id, e.status])
  );
  const emailMap = new Map(
    (usersRes.data?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Alunos</h1>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="px-3 py-3">Aluno</th>
              <th className="px-3 py-3">Créditos</th>
              <th className="px-3 py-3">Matrícula</th>
              <th className="px-3 py-3">Conceder créditos</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => (
              <AdminStudentRow
                key={p.id}
                userId={p.id}
                courseId={courseId}
                name={p.full_name ?? "Aluno"}
                email={emailMap.get(p.id) ?? ""}
                credits={creditMap.get(p.id) ?? 0}
                enrolled={enrollMap.get(p.id) === "active"}
              />
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
