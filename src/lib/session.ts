import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";
import { getActiveDelegation } from "@/lib/delegation";

export async function requireUser(allowedRoles?: Role[]) {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion");
  }

  let user = session.user;

  if (session.user.role === "ADMIN_PLATEFORME") {
    const delegation = await getActiveDelegation(session.user.id);

    if (delegation) {
      user = {
        ...session.user,
        id: delegation.cible.id,
        name: `${delegation.cible.prenom} ${delegation.cible.nom}`,
        email: delegation.cible.email,
        role: delegation.cible.role,
        garderieId: delegation.cible.garderieId,
      };
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/connexion");
  }

  return user;
}

export const ROLES_DIRECTION: Role[] = ["DIRECTION", "RESPONSABLE"];
export const ROLES_PRO: Role[] = ["PROFESSIONNEL", "RESPONSABLE", "DIRECTION"];
export const ROLES_PARENT: Role[] = ["PARENT"];
