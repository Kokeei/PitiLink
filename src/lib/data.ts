import { prisma } from "@/lib/prisma";
import { debutJournee, finJournee } from "@/lib/format";
import type { TypeJournalEvenement } from "@/generated/prisma/enums";

export async function getEnfantsPourProfessionnel(userId: string, garderieId: string) {
  const affectations = await prisma.affectation.findMany({
    where: { professionnelId: userId, actif: true, enfant: { garderieId } },
    select: { enfantId: true },
  });

  const enfantIds = affectations.map((a) => a.enfantId);

  const where =
    enfantIds.length > 0
      ? { id: { in: enfantIds }, statut: "ACTIF" as const }
      : { garderieId, statut: "ACTIF" as const };

  return prisma.enfant.findMany({
    where,
    include: { groupe: true },
    orderBy: { prenom: "asc" },
  });
}

export async function getEnfantsDuParent(userId: string) {
  const liens = await prisma.parentEnfant.findMany({
    where: { userId },
    include: { enfant: { include: { groupe: true } } },
  });
  return liens.map((l) => l.enfant);
}

export async function getEnfantsDuGroupe(garderieId: string, groupeId?: string) {
  return prisma.enfant.findMany({
    where: { garderieId, statut: "ACTIF", ...(groupeId ? { groupeId } : {}) },
    include: { groupe: true },
    orderBy: { prenom: "asc" },
  });
}

const TYPES_SUIVIS: TypeJournalEvenement[] = [
  "BIBERON",
  "REPAS",
  "CHANGE",
  "SIESTE",
  "ACTIVITE",
  "BAIN",
  "HUMEUR",
];

export async function getStatutJournalDuJour(enfantId: string) {
  const evenements = await prisma.journalEvenement.findMany({
    where: {
      enfantId,
      timestamp: { gte: debutJournee(), lte: finJournee() },
      statut: "REALISE",
      type: { in: TYPES_SUIVIS },
    },
    select: { type: true },
  });

  const fait = new Set(evenements.map((e) => e.type));
  return TYPES_SUIVIS.map((type) => ({ type, fait: fait.has(type) }));
}

export async function getJournalDuJour(enfantId: string, date?: Date) {
  return prisma.journalEvenement.findMany({
    where: {
      enfantId,
      timestamp: { gte: debutJournee(date), lte: finJournee(date) },
    },
    include: { auteur: { select: { prenom: true, nom: true } } },
    orderBy: { timestamp: "asc" },
  });
}

export async function getActivitesRecentes(enfantId: string, limite = 10) {
  return prisma.journalEvenement.findMany({
    where: { enfantId, type: "ACTIVITE" },
    include: { auteur: { select: { prenom: true, nom: true } } },
    orderBy: { timestamp: "desc" },
    take: limite,
  });
}

export async function getPresenceDuJour(enfantId: string, date = new Date()) {
  return prisma.presence.findUnique({
    where: { enfantId_date: { enfantId, date: debutJournee(date) } },
  });
}
