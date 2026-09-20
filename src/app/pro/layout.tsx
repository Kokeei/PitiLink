import { requireUser, ROLES_PRO } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { LIENS_PRO } from "@/lib/navigation";

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(ROLES_PRO);

  return (
    <AppShell items={LIENS_PRO} userId={user.id} userName={user.name ?? ""} role={user.role} rechercheAction="/pro">
      {children}
    </AppShell>
  );
}
