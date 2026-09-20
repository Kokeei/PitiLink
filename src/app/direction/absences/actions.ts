"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";

export async function modifierReglesAbsence(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const absenceDelaiPreavisJours = Number(formData.get("absenceDelaiPreavisJours"));
  const absenceMaladieCertificatDecompte = formData.get("absenceMaladieCertificatDecompte") === "on";
  const absenceMaladieSansCertificatDecompte = formData.get("absenceMaladieSansCertificatDecompte") === "on";
  if (!Number.isFinite(absenceDelaiPreavisJours) || absenceDelaiPreavisJours < 0) return;

  await prisma.garderie.update({
    where: { id: user.garderieId! },
    data: { absenceDelaiPreavisJours, absenceMaladieCertificatDecompte, absenceMaladieSansCertificatDecompte },
  });

  revalidatePath("/direction/absences");
}

export async function annulerAbsence(absenceId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.absence.updateMany({
    where: { id: absenceId, enfant: { garderieId: user.garderieId! } },
    data: { statut: "ANNULEE" },
  });
  revalidatePath("/direction/absences");
}
