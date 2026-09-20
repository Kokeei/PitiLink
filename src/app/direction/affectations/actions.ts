"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";

export async function creerAffectation(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const enfantId = formData.get("enfantId") as string;
  const professionnelId = formData.get("professionnelId") as string;
  const referente = formData.get("referente") === "on";
  if (!enfantId || !professionnelId) return;

  const [enfant, pro] = await Promise.all([
    prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } }),
    prisma.user.findFirst({ where: { id: professionnelId, garderieId: user.garderieId! } }),
  ]);
  if (!enfant || !pro) return;

  await prisma.affectation.create({
    data: { enfantId, professionnelId, groupeId: enfant.groupeId, referente, joursSemaine: [] },
  });
  revalidatePath("/direction/affectations");
}

export async function supprimerAffectation(affectationId: string) {
  await requireUser(ROLES_DIRECTION);
  await prisma.affectation.delete({ where: { id: affectationId } });
  revalidatePath("/direction/affectations");
}

export async function reaffecter(affectationId: string, formData: FormData) {
  await requireUser(ROLES_DIRECTION);
  const nouveauProfessionnelId = formData.get("professionnelId") as string;
  await prisma.affectation.update({
    where: { id: affectationId },
    data: { professionnelId: nouveauProfessionnelId },
  });
  revalidatePath("/direction/affectations");
}
