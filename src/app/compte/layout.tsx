import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { LIENS_DIRECTION, LIENS_PRO, LIENS_PARENT } from "@/lib/navigation";

const LIENS_PAR_ROLE = {
  DIRECTION: LIENS_DIRECTION,
  RESPONSABLE: LIENS_DIRECTION,
  PROFESSIONNEL: LIENS_PRO,
  PARENT: LIENS_PARENT,
  ADMIN_PLATEFORME: [],
};

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell items={LIENS_PAR_ROLE[user.role]} userId={user.id} userName={user.name ?? ""} role={user.role}>
      <div className="mx-auto w-full max-w-lg">{children}</div>
    </AppShell>
  );
}
