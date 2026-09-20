import { requireUser, ROLES_PRO } from "@/lib/session";
import { AppShell } from "@/components/AppShell";

const LIENS = [
  { href: "/pro", label: "Aujourd'hui", icone: "🏠" },
  { href: "/pro/groupe", label: "Groupe", icone: "👥" },
];

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(ROLES_PRO);

  return (
    <AppShell items={LIENS} userId={user.id} userName={user.name ?? ""} role={user.role} rechercheAction="/pro">
      {children}
    </AppShell>
  );
}
