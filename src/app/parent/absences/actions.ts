"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PARENT } from "@/lib/session";
import { uploaderFichier } from "@/lib/blob";
import { creerNotifications } from "@/lib/notifications";
import { formatDate } from "@/lib/format";
import type { TypeAbsence } from "@/generated/prisma/enums";

export async function declarerAbsence(formData: FormData) {
  const user = await requireUser(ROLES_PARENT);
  const enfantId = formData.get("enfantId") as string;
  const type = formData.get("type") as TypeAbsence;
  const dateDebut = formData.get("dateDebut") as string;
  const dateFin = formData.get("dateFin") as string;
  const commentaire = formData.get("commentaire") as string;
  const justificatif = formData.get("justificatif") as File | null;

  const lienParent = await prisma.parentEnfant.findFirst({
    where: { enfantId, userId: user.id },
    include: { enfant: true },
  });
  if (!lienParent || !type || !dateDebut || !dateFin || new Date(dateFin) < new Date(dateDebut)) return;

  const justificatifUrl = await uploaderFichier(justificatif, `enfants/${enfantId}/justificatifs`);

  await prisma.absence.create({
    data: {
      enfantId,
      type,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      commentaire: commentaire || undefined,
      justificatifUrl,
      declareParId: user.id,
    },
  });

  const destinataires = await prisma.user.findMany({
    where: { garderieId: lienParent.enfant.garderieId, role: { in: ["DIRECTION", "RESPONSABLE"] } },
    select: { id: true },
  });
  await creerNotifications(
    destinataires.map((d) => d.id),
    {
      type: "ABSENCE_DECLAREE",
      contenu: `Absence déclarée pour ${lienParent.enfant.prenom} (${formatDate(dateDebut)} → ${formatDate(dateFin)})`,
      lien: "/direction/absences",
    }
  );

  revalidatePath("/parent/absences");
  revalidatePath("/direction/absences");
}
