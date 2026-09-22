import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

export const DELEGATION_COOKIE = "pitilink-delegation";
export const DUREE_DELEGATION_MS = 8 * 60 * 60 * 1000;

export const ROLES_DELEGABLES: Role[] = [
  "PARENT",
  "PROFESSIONNEL",
  "RESPONSABLE",
  "DIRECTION",
];

export function espacePourRole(role: Role) {
  switch (role) {
    case "PARENT":
      return "/parent";
    case "PROFESSIONNEL":
      return "/pro";
    case "RESPONSABLE":
    case "DIRECTION":
      return "/direction";
    case "ADMIN_PLATEFORME":
      return "/admin";
  }
}

export async function getActiveDelegation(adminId: string) {
  const cookieStore = await cookies();
  const id = cookieStore.get(DELEGATION_COOKIE)?.value;

  if (!id) return null;

  const delegation = await prisma.delegation.findFirst({
    where: {
      id,
      adminId,
      termineeLe: null,
    },
    include: {
      cible: true,
    },
  });

  if (!delegation) return null;

  if (delegation.expireLe && delegation.expireLe <= new Date()) {
    await prisma.delegation.update({
      where: { id: delegation.id },
      data: { termineeLe: new Date() },
    });
    return null;
  }

  return delegation;
}
