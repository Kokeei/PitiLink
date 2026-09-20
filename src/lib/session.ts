import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";

export async function requireUser(allowedRoles?: Role[]) {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion");
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect("/connexion");
  }
  return session.user;
}

export const ROLES_DIRECTION: Role[] = ["DIRECTION", "RESPONSABLE"];
export const ROLES_PRO: Role[] = ["PROFESSIONNEL", "RESPONSABLE", "DIRECTION"];
export const ROLES_PARENT: Role[] = ["PARENT"];
