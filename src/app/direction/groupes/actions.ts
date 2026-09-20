"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";

export async function creerGroupe(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const nom = formData.get("nom") as string;
  const capacite = formData.get("capacite") ? Number(formData.get("capacite")) : undefined;
  if (!nom) return;

  await prisma.groupe.create({
    data: { garderieId: user.garderieId!, nom, capacite },
  });
  revalidatePath("/direction/groupes");
}

export async function supprimerGroupe(groupeId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  const groupe = await prisma.groupe.findFirst({ where: { id: groupeId, garderieId: user.garderieId! } });
  if (!groupe) return;
  await prisma.groupe.delete({ where: { id: groupeId } });
  revalidatePath("/direction/groupes");
}
