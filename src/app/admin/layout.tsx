import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActiveDelegation, espacePourRole } from "@/lib/delegation";
import { AppShell } from "@/components/AppShell";
import { LIENS_ADMIN } from "@/lib/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN_PLATEFORME") {
    redirect("/connexion");
  }

  const active = await getActiveDelegation(session.user.id);
  if (active) {
    redirect(espacePourRole(active.cible.role));
  }

  return (
    <AppShell
      items={LIENS_ADMIN}
      userId={session.user.id}
      userName={session.user.name ?? ""}
      role={session.user.role}
    >
      {children}
    </AppShell>
  );
}
