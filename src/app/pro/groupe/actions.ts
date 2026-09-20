"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PRO } from "@/lib/session";

export async function ajouterActiviteGroupee(formData: FormData) {
  const user = await requireUser(ROLES_PRO);
  const enfantIds = formData.getAll("enfantIds") as string[];
  const nom = formData.get("nom") as string;
  if (enfantIds.length === 0 || !nom) return;

  const enfants = await prisma.enfant.findMany({
    where: { id: { in: enfantIds }, garderieId: user.garderieId! },
    select: { id: true },
  });

  await prisma.journalEvenement.createMany({
    data: enfants.map((e) => ({
      garderieId: user.garderieId!,
      enfantId: e.id,
      type: "ACTIVITE" as const,
      statut: "REALISE" as const,
      auteurId: user.id,
      donneesReelles: JSON.stringify({ nom }),
    })),
  });

  revalidatePath("/pro/groupe");
  revalidatePath("/pro");
}
