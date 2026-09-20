"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { uploaderFichier } from "@/lib/blob";

async function contexte(enfantId: string) {
  const user = await requireUser(ROLES_PRO);
  const enfant = await prisma.enfant.findFirstOrThrow({
    where: { id: enfantId, garderieId: user.garderieId! },
  });
  return { user, enfant };
}

function revalider(enfantId: string) {
  revalidatePath(`/pro/enfants/${enfantId}`);
  revalidatePath("/pro");
  revalidatePath("/pro/groupe");
}

export async function ajouterBiberon(enfantId: string, formData: FormData) {
  const { user, enfant } = await contexte(enfantId);
  const quantiteMl = Number(formData.get("quantite"));

  await prisma.journalEvenement.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      type: "BIBERON",
      statut: "REALISE",
      auteurId: user.id,
      donneesReelles: JSON.stringify({ quantiteMl }),
    },
  });
  revalider(enfantId);
}

export async function ajouterRepas(enfantId: string, formData: FormData) {
  const { user, enfant } = await contexte(enfantId);
  const repas = formData.get("repas") as string;
  const quantite = formData.get("quantite") as string;

  await prisma.journalEvenement.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      type: "REPAS",
      statut: "REALISE",
      auteurId: user.id,
      donneesReelles: JSON.stringify({ repas, quantite }),
    },
  });
  revalider(enfantId);
}

export async function ajouterChange(enfantId: string, formData: FormData) {
  const { user, enfant } = await contexte(enfantId);
  const urine = formData.get("urine") === "true";
  const selle = formData.get("selle") === "true";

  await prisma.journalEvenement.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      type: "CHANGE",
      statut: "REALISE",
      auteurId: user.id,
      donneesReelles: JSON.stringify({ urine, selle }),
    },
  });
  revalider(enfantId);
}

export async function demarrerSieste(enfantId: string) {
  const { user, enfant } = await contexte(enfantId);
  await prisma.journalEvenement.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      type: "SIESTE",
      statut: "REALISE",
      auteurId: user.id,
      donneesReelles: JSON.stringify({ heureDebut: new Date().toISOString() }),
    },
  });
  revalider(enfantId);
}

export async function terminerSieste(enfantId: string, evenementId: string) {
  await contexte(enfantId);
  const evt = await prisma.journalEvenement.findUniqueOrThrow({ where: { id: evenementId } });
  const donnees = evt.donneesReelles ? JSON.parse(evt.donneesReelles) : {};

  await prisma.journalEvenement.update({
    where: { id: evenementId },
    data: {
      donneesReelles: JSON.stringify({
        ...donnees,
        heureDebut: donnees.heureDebut ? new Date(donnees.heureDebut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : undefined,
        heureFin: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      }),
    },
  });
  revalider(enfantId);
}

export async function ajouterHumeur(enfantId: string, formData: FormData) {
  const { user, enfant } = await contexte(enfantId);
  const humeur = formData.get("humeur") as string;

  await prisma.journalEvenement.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      type: "HUMEUR",
      statut: "REALISE",
      auteurId: user.id,
      donneesReelles: JSON.stringify({ humeur }),
    },
  });
  revalider(enfantId);
}

export async function ajouterActivite(enfantId: string, formData: FormData) {
  const { user, enfant } = await contexte(enfantId);
  const nom = formData.get("nom") as string;

  await prisma.journalEvenement.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      type: "ACTIVITE",
      statut: "REALISE",
      auteurId: user.id,
      donneesReelles: JSON.stringify({ nom }),
    },
  });
  revalider(enfantId);
}

export async function ajouterBain(enfantId: string, formData: FormData) {
  const { user, enfant } = await contexte(enfantId);
  const type = formData.get("type") as string;

  await prisma.journalEvenement.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      type: "BAIN",
      statut: "REALISE",
      auteurId: user.id,
      donneesReelles: JSON.stringify({ type }),
    },
  });
  revalider(enfantId);
}

export async function ajouterObservation(enfantId: string, formData: FormData) {
  const { user, enfant } = await contexte(enfantId);
  const commentaire = formData.get("commentaire") as string;
  if (!commentaire?.trim()) return;

  await prisma.journalEvenement.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      type: "OBSERVATION",
      statut: "REALISE",
      auteurId: user.id,
      commentaire,
    },
  });
  revalider(enfantId);
}

export async function marquerPresence(enfantId: string, type: "arrivee" | "depart") {
  const { user, enfant } = await contexte(enfantId);
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const maintenant = new Date();

  await prisma.presence.upsert({
    where: { enfantId_date: { enfantId, date: aujourdhui } },
    create: {
      enfantId,
      date: aujourdhui,
      statut: "PRESENT",
      heureArrivee: type === "arrivee" ? maintenant : undefined,
      heureDepart: type === "depart" ? maintenant : undefined,
    },
    update:
      type === "arrivee"
        ? { statut: "PRESENT", heureArrivee: maintenant }
        : { heureDepart: maintenant },
  });

  await prisma.journalEvenement.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      type: type === "arrivee" ? "ARRIVEE" : "DEPART",
      statut: "REALISE",
      auteurId: user.id,
    },
  });

  revalider(enfantId);
}

export async function enregistrerAcquisition(enfantId: string, formData: FormData) {
  const { user, enfant } = await contexte(enfantId);
  const competenceId = formData.get("competenceId") as string;
  const note = (formData.get("note") as string) || undefined;
  const photoUrl = (formData.get("photoUrl") as string) || undefined;
  if (!competenceId) return;

  const competence = await prisma.competence.findFirst({
    where: { id: competenceId, garderieId: enfant.garderieId },
  });
  if (!competence) return;

  await prisma.acquisitionCompetence.create({
    data: {
      garderieId: enfant.garderieId,
      enfantId,
      competenceId,
      groupeId: enfant.groupeId,
      auteurId: user.id,
      note,
      photoUrl,
    },
  });

  revalidatePath(`/pro/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
  revalidatePath(`/direction/enfants/${enfantId}`);
}

export async function enregistrerAcquisitions(enfantId: string, formData: FormData) {
  const { user, enfant } = await contexte(enfantId);
  const competenceIds = formData.getAll("competenceIds") as string[];
  const note = (formData.get("note") as string) || undefined;
  const photoUrl = (formData.get("photoUrl") as string) || undefined;
  if (competenceIds.length === 0) return;

  const competences = await prisma.competence.findMany({
    where: { id: { in: competenceIds }, garderieId: enfant.garderieId },
    select: { id: true },
  });

  await prisma.acquisitionCompetence.createMany({
    data: competences.map((c) => ({
      garderieId: enfant.garderieId,
      enfantId,
      competenceId: c.id,
      groupeId: enfant.groupeId,
      auteurId: user.id,
      note,
      photoUrl,
    })),
  });

  revalidatePath(`/pro/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
  revalidatePath(`/direction/enfants/${enfantId}`);
}

export async function modifierPhotoEnfant(enfantId: string, formData: FormData) {
  const { enfant } = await contexte(enfantId);
  if (enfant.autorisationPhotos !== "AUTORISEE") return;
  const fichier = formData.get("photo") as File | null;

  const url = await uploaderFichier(fichier, `enfants/${enfantId}/profil`);
  if (!url) return;

  await prisma.enfant.update({ where: { id: enfant.id }, data: { photoUrl: url } });
  revalider(enfantId);
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
}

export async function ajouterPhotoSouvenir(enfantId: string, formData: FormData) {
  const { user, enfant } = await contexte(enfantId);
  if (enfant.autorisationPhotos !== "AUTORISEE") return;
  const fichier = formData.get("photo") as File | null;
  const legende = (formData.get("legende") as string) || undefined;

  const url = await uploaderFichier(fichier, `enfants/${enfantId}/souvenirs`);
  if (!url) return;

  await prisma.photo.create({
    data: { garderieId: enfant.garderieId, enfantId, url, legende, auteurId: user.id },
  });
  revalider(enfantId);
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
}
