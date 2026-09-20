import { requireUser, ROLES_PARENT } from "@/lib/session";
import { AppShell } from "@/components/AppShell";

const LIENS = [
  { href: "/parent", label: "Mes enfants", icone: "👶" },
  { href: "/parent/absences", label: "Absences", icone: "🏖️" },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(ROLES_PARENT);

  return (
    <AppShell items={LIENS} userId={user.id} userName={user.name ?? ""} role={user.role}>
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </AppShell>
  );
}
