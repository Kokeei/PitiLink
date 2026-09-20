import { requireUser, ROLES_PARENT } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { LIENS_PARENT } from "@/lib/navigation";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(ROLES_PARENT);

  return (
    <AppShell items={LIENS_PARENT} userId={user.id} userName={user.name ?? ""} role={user.role}>
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </AppShell>
  );
}
