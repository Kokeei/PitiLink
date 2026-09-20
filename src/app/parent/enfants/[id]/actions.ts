"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PARENT } from "@/lib/session";

async function verifierAcces(enfantId: string) {
  const user = await requireUser(ROLES_PARENT);
  const lien = await prisma.parentEnfant.findFirst({ where: { enfantId, userId: user.id } });
  if (!lien) throw new Error("Accès non autorisé à cet enfant.");
  return user;
}

export async function ajouterMesureCroissance(enfantId: string, formData: FormData) {
  const user = await verifierAcces(enfantId);
  const poidsKg = formData.get("poidsKg") ? Number(formData.get("poidsKg")) : undefined;
  const tailleCm = formData.get("tailleCm") ? Number(formData.get("tailleCm")) : undefined;
  const perimetreCranienCm = formData.get("perimetreCranienCm")
    ? Number(formData.get("perimetreCranienCm"))
    : undefined;

  if (!poidsKg && !tailleCm && !perimetreCranienCm) return;

  await prisma.croissance.create({
    data: {
      enfantId,
      date: new Date(),
      poidsKg,
      tailleCm,
      perimetreCranienCm,
      auteurId: user.id,
    },
  });
  revalidatePath(`/parent/enfants/${enfantId}`);
}

export async function transmettreInformation(enfantId: string, formData: FormData) {
  const user = await verifierAcces(enfantId);
  const commentaire = formData.get("commentaire") as string;
  if (!commentaire?.trim()) return;

  const enfant = await prisma.enfant.findUniqueOrThrow({ where: { id: enfantId } });

  await prisma.journalEvenement.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      type: "OBSERVATION",
      statut: "REALISE",
      auteurId: user.id,
      commentaire: `[Transmission parent] ${commentaire}`,
    },
  });
  revalidatePath(`/parent/enfants/${enfantId}`);
}

export async function ajouterContactUrgence(enfantId: string, formData: FormData) {
  await verifierAcces(enfantId);
  const nom = formData.get("nom") as string;
  const prenom = formData.get("prenom") as string;
  const lien = formData.get("lien") as string;
  const telephone = formData.get("telephone") as string;
  if (!nom || !prenom || !telephone) return;

  const nbExistants = await prisma.contactUrgence.count({ where: { enfantId } });

  await prisma.contactUrgence.create({
    data: { enfantId, nom, prenom, lien, telephone, ordrePriorite: nbExistants + 1 },
  });
  revalidatePath(`/parent/enfants/${enfantId}`);
}
