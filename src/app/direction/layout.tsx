import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { LIENS_DIRECTION } from "@/lib/navigation";

export default async function DirectionLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(ROLES_DIRECTION);

  return (
    <AppShell items={LIENS_DIRECTION} userId={user.id} userName={user.name ?? ""} role={user.role} rechercheAction="/direction/enfants">
      {children}
    </AppShell>
  );
}
