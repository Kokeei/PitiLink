"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";

function revalider() {
  revalidatePath("/direction/competences");
  revalidatePath("/pro", "layout");
}

export async function creerCategorie(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const nom = formData.get("nom") as string;
  const icone = (formData.get("icone") as string) || undefined;
  if (!nom) return;

  const nbExistantes = await prisma.categorieCompetence.count({ where: { garderieId: user.garderieId! } });

  await prisma.categorieCompetence.create({
    data: { garderieId: user.garderieId!, nom, icone, ordre: nbExistantes },
  });
  revalider();
}

export async function toggleCategorieActive(categorieId: string, actif: boolean) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.categorieCompetence.updateMany({
    where: { id: categorieId, garderieId: user.garderieId! },
    data: { actif },
  });
  revalider();
}

export async function supprimerCategorie(categorieId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  const categorie = await prisma.categorieCompetence.findFirst({
    where: { id: categorieId, garderieId: user.garderieId! },
    include: { _count: { select: { competences: true } } },
  });
  if (!categorie || categorie._count.competences > 0) return;

  await prisma.categorieCompetence.delete({ where: { id: categorieId } });
  revalider();
}

export async function creerCompetence(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const categorieId = formData.get("categorieId") as string;
  const nom = formData.get("nom") as string;
  const icone = (formData.get("icone") as string) || undefined;
  const ageMin = formData.get("ageMin") ? Number(formData.get("ageMin")) : undefined;
  const ageMax = formData.get("ageMax") ? Number(formData.get("ageMax")) : undefined;
  if (!categorieId || !nom) return;

  const categorie = await prisma.categorieCompetence.findFirst({
    where: { id: categorieId, garderieId: user.garderieId! },
  });
  if (!categorie) return;

  const nbExistantes = await prisma.competence.count({ where: { categorieId } });

  await prisma.competence.create({
    data: {
      garderieId: user.garderieId!,
      categorieId,
      nom,
      icone,
      ageIndicatifMoisMin: ageMin,
      ageIndicatifMoisMax: ageMax,
      ordreAffichage: nbExistantes,
    },
  });
  revalider();
}

export async function toggleCompetenceActive(competenceId: string, actif: boolean) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.competence.updateMany({
    where: { id: competenceId, garderieId: user.garderieId! },
    data: { actif },
  });
  revalider();
}

export async function supprimerCompetence(competenceId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  const competence = await prisma.competence.findFirst({
    where: { id: competenceId, garderieId: user.garderieId! },
    include: { _count: { select: { acquisitions: true } } },
  });
  if (!competence || competence._count.acquisitions > 0) return;

  await prisma.competence.delete({ where: { id: competenceId } });
  revalider();
}
