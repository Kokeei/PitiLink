"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import type { StatutEnfant, TypeInfoImportante } from "@/generated/prisma/enums";

export async function creerEnfant(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const dateNaissance = formData.get("dateNaissance") as string;
  const groupeId = (formData.get("groupeId") as string) || undefined;

  if (!prenom || !nom || !dateNaissance) return;

  const enfant = await prisma.enfant.create({
    data: {
      garderieId: user.garderieId!,
      prenom,
      nom,
      dateNaissance: new Date(dateNaissance),
      groupeId,
      dateInscription: new Date(),
      statut: "ACTIF",
    },
  });

  revalidatePath("/direction/enfants");
  redirect(`/direction/enfants/${enfant.id}`);
}

export async function modifierStatutEnfant(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const statut = formData.get("statut") as StatutEnfant;
  const groupeId = (formData.get("groupeId") as string) || null;

  await prisma.enfant.update({
    where: { id: enfantId, garderieId: user.garderieId! },
    data: { statut, groupeId },
  });
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath("/direction/enfants");
}

export async function ajouterInfoImportante(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const type = formData.get("type") as TypeInfoImportante;
  const titre = formData.get("titre") as string;
  const description = formData.get("description") as string;
  const critique = formData.get("critique") === "on";
  if (!titre) return;

  await prisma.enfant.findFirstOrThrow({ where: { id: enfantId, garderieId: user.garderieId! } });

  await prisma.infoImportante.create({
    data: { enfantId, type, titre, description: description || undefined, critique },
  });
  revalidatePath(`/direction/enfants/${enfantId}`);
}

export async function supprimerInfoImportante(enfantId: string, infoId: string) {
  await requireUser(ROLES_DIRECTION);
  await prisma.infoImportante.delete({ where: { id: infoId } });
  revalidatePath(`/direction/enfants/${enfantId}`);
}

export async function corrigerAcquisition(enfantId: string, acquisitionId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const nouvelleNote = (formData.get("note") as string) || null;

  const acquisition = await prisma.acquisitionCompetence.findFirst({
    where: { id: acquisitionId, garderieId: user.garderieId! },
  });
  if (!acquisition) return;

  await prisma.acquisitionCompetence.update({
    where: { id: acquisitionId },
    data: {
      note: nouvelleNote,
      noteOriginale: acquisition.noteOriginale ?? acquisition.note,
      modifieParId: user.id,
      modifieLe: new Date(),
    },
  });
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
}

export async function supprimerAcquisition(enfantId: string, acquisitionId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.acquisitionCompetence.deleteMany({
    where: { id: acquisitionId, garderieId: user.garderieId! },
  });
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
}
