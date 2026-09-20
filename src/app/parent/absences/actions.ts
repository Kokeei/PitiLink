"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PARENT } from "@/lib/session";
import type { TypeAbsence } from "@/generated/prisma/enums";

export async function declarerAbsence(formData: FormData) {
  const user = await requireUser(ROLES_PARENT);
  const enfantId = formData.get("enfantId") as string;
  const type = formData.get("type") as TypeAbsence;
  const dateDebut = formData.get("dateDebut") as string;
  const dateFin = formData.get("dateFin") as string;
  const commentaire = formData.get("commentaire") as string;

  const lien = await prisma.parentEnfant.findFirst({ where: { enfantId, userId: user.id } });
  if (!lien || !type || !dateDebut || !dateFin) return;

  await prisma.absence.create({
    data: {
      enfantId,
      type,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      commentaire: commentaire || undefined,
      declareParId: user.id,
    },
  });

  revalidatePath("/parent/absences");
}
