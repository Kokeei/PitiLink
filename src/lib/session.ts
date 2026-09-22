import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";
import { getActiveDelegation } from "@/lib/delegation";

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: Role;
  garderieId?: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  // L'admin reste l'identité authentifiée. La délégation ne change que
  // l'identité effective utilisée par les écrans métier et leurs actions.
  if (session.user.role !== "ADMIN_PLATEFORME") return session.user;

  const delegation = await getActiveDelegation(session.user.id);
  if (!delegation) return session.user;

  return {
    id: delegation.cible.id,
    email: delegation.cible.email,
    name: `${delegation.cible.prenom} ${delegation.cible.nom}`,
    role: delegation.cible.role,
    garderieId: delegation.cible.garderieId,
  };
}

export async function requireUser(allowedRoles?: Role[]) {
  const user = await getCurrentUser();

  if (!user) redirect("/connexion");

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/connexion");
  }

  return user;
}

export const ROLES_DIRECTION: Role[] = ["DIRECTION", "RESPONSABLE"];
export const ROLES_PRO: Role[] = ["PROFESSIONNEL", "RESPONSABLE", "DIRECTION"];
export const ROLES_PARENT: Role[] = ["PARENT"];
