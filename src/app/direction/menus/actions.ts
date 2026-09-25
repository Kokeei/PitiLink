"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { lundiDeLaSemaine } from "@/lib/menus";
import type { PorteeMenu } from "@/generated/prisma/enums";

async function garderieDe(userGarderieId: string, semaineId: string) {
  return prisma.semaineMenu.findFirst({ where: { id: semaineId, garderieId: userGarderieId } });
}

export async function creerSemaine(dateDebut: string) {
  const user = await requireUser(ROLES_DIRECTION);
  const lundi = lundiDeLaSemaine(new Date(dateDebut));
  await prisma.semaineMenu.upsert({
    where: { garderieId_dateDebut: { garderieId: user.garderieId!, dateDebut: lundi } },
    create: { garderieId: user.garderieId!, dateDebut: lundi },
    update: {},
  });
  revalidatePath("/direction/menus");
}

/**
 * Crée ou remplace une entrée de menu (portée générale, catégorie ou
 * individuelle) pour un jour/repas donné : liste d'aliments + note.
 *
 * Protection §12 : sur une semaine déjà publiée, la case "confirmerModification"
 * doit être cochée, sinon la modification est silencieusement ignorée. Une
 * semaine archivée ne peut plus être modifiée du tout.
 */
export async function upsertMenuEntree(
  semaineId: string,
  jourSemaine: number,
  typeRepasId: string,
  portee: PorteeMenu,
  groupeId: string | null,
  enfantId: string | null,
  formData: FormData
) {
  const user = await requireUser(ROLES_DIRECTION);
  const semaine = await garderieDe(user.garderieId!, semaineId);
  if (!semaine) return;
  if (semaine.statut === "ARCHIVE") return;
  if (semaine.statut === "PUBLIE" && formData.get("confirmerModification") !== "on") return;

  // La portée détermine quelle référence doit appartenir à la garderie de
  // l'appelant : semaineId est déjà vérifié ci-dessus, mais typeRepasId,
  // groupeId et enfantId sont reçus en paramètre de l'action et doivent
  // être revérifiés ici pour empêcher qu'une entrée de menu soit créée
  // avec une référence appartenant à une autre garderie.
  const [typeRepasValide, groupeValide, enfantValide] = await Promise.all([
    prisma.typeRepas.findFirst({ where: { id: typeRepasId, garderieId: user.garderieId! } }),
    groupeId ? prisma.groupe.findFirst({ where: { id: groupeId, garderieId: user.garderieId! } }) : Promise.resolve(true),
    enfantId ? prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } }) : Promise.resolve(true),
  ]);
  if (!typeRepasValide || !groupeValide || !enfantValide) return;

  const alimentIds = formData.getAll("alimentIds") as string[];
  const note = (formData.get("note") as string) || null;
  if (alimentIds.length === 0) return;

  const aliments = await prisma.aliment.findMany({ where: { id: { in: alimentIds }, garderieId: user.garderieId! } });
  if (aliments.length === 0) return;

  const existante = await prisma.menuEntree.findFirst({
    where: { semaineId, jourSemaine, typeRepasId, portee, groupeId, enfantId },
  });

  const entree = existante
    ? await prisma.menuEntree.update({ where: { id: existante.id }, data: { note } })
    : await prisma.menuEntree.create({ data: { semaineId, jourSemaine, typeRepasId, portee, groupeId, enfantId, note } });

  await prisma.menuComposant.deleteMany({ where: { menuEntreeId: entree.id } });
  await prisma.menuComposant.createMany({
    data: aliments.map((a, i) => ({ menuEntreeId: entree.id, alimentId: a.id, ordre: i })),
  });

  revalidatePath("/direction/menus");
  revalidatePath("/pro/menus");
  revalidatePath("/parent");
}

export async function supprimerMenuEntree(semaineId: string, entreeId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const semaine = await garderieDe(user.garderieId!, semaineId);
  if (!semaine) return;
  if (semaine.statut === "ARCHIVE") return;
  if (semaine.statut === "PUBLIE" && formData.get("confirmerModification") !== "on") return;

  await prisma.menuEntree.deleteMany({ where: { id: entreeId, semaineId } });

  revalidatePath("/direction/menus");
  revalidatePath("/pro/menus");
  revalidatePath("/parent");
}

export async function copierJour(semaineId: string, jourSource: number, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const jourCible = Number(formData.get("jourCible"));
  const semaine = await garderieDe(user.garderieId!, semaineId);
  if (!semaine || semaine.statut === "ARCHIVE" || !Number.isInteger(jourCible) || jourSource === jourCible) return;

  const entreesSource = await prisma.menuEntree.findMany({
    where: { semaineId, jourSemaine: jourSource },
    include: { composants: true },
  });

  await prisma.menuEntree.deleteMany({ where: { semaineId, jourSemaine: jourCible } });

  for (const e of entreesSource) {
    await prisma.menuEntree.create({
      data: {
        semaineId,
        jourSemaine: jourCible,
        typeRepasId: e.typeRepasId,
        portee: e.portee,
        groupeId: e.groupeId,
        enfantId: e.enfantId,
        note: e.note,
        composants: {
          create: e.composants.map((c) => ({
            alimentId: c.alimentId,
            remplaceAlimentId: c.remplaceAlimentId,
            motifRemplacement: c.motifRemplacement,
            ordre: c.ordre,
          })),
        },
      },
    });
  }

  revalidatePath("/direction/menus");
}

export async function dupliquerSemaine(semaineIdSource: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const nouvelleDateDebut = formData.get("nouvelleDateDebut") as string;
  if (!nouvelleDateDebut) return;

  const source = await prisma.semaineMenu.findFirst({
    where: { id: semaineIdSource, garderieId: user.garderieId! },
    include: { entrees: { include: { composants: true } } },
  });
  if (!source) return;

  const lundi = lundiDeLaSemaine(new Date(nouvelleDateDebut));
  const cible = await prisma.semaineMenu.upsert({
    where: { garderieId_dateDebut: { garderieId: user.garderieId!, dateDebut: lundi } },
    create: { garderieId: user.garderieId!, dateDebut: lundi },
    update: {},
  });
  if (cible.statut === "ARCHIVE") return;

  await prisma.menuEntree.deleteMany({ where: { semaineId: cible.id } });

  for (const e of source.entrees) {
    await prisma.menuEntree.create({
      data: {
        semaineId: cible.id,
        jourSemaine: e.jourSemaine,
        typeRepasId: e.typeRepasId,
        portee: e.portee,
        groupeId: e.groupeId,
        enfantId: e.enfantId,
        note: e.note,
        composants: {
          create: e.composants.map((c) => ({
            alimentId: c.alimentId,
            remplaceAlimentId: c.remplaceAlimentId,
            motifRemplacement: c.motifRemplacement,
            ordre: c.ordre,
          })),
        },
      },
    });
  }

  revalidatePath("/direction/menus");
}

export async function publierSemaine(semaineId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.semaineMenu.updateMany({
    where: { id: semaineId, garderieId: user.garderieId!, statut: "BROUILLON" },
    data: { statut: "PUBLIE" },
  });
  revalidatePath("/direction/menus");
  revalidatePath("/pro/menus");
  revalidatePath("/parent");
}

export async function archiverSemaine(semaineId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.semaineMenu.updateMany({
    where: { id: semaineId, garderieId: user.garderieId! },
    data: { statut: "ARCHIVE" },
  });
  revalidatePath("/direction/menus");
}

export async function remettreEnBrouillon(semaineId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.semaineMenu.updateMany({
    where: { id: semaineId, garderieId: user.garderieId!, statut: "PUBLIE" },
    data: { statut: "BROUILLON" },
  });
  revalidatePath("/direction/menus");
}

// --- Gestion des aliments, allergènes, types de repas (paramètres) --------

export async function creerAllergene(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const nom = (formData.get("nom") as string)?.trim();
  if (!nom) return;
  await prisma.allergene.create({ data: { garderieId: user.garderieId!, nom } }).catch(() => null);
  revalidatePath("/direction/menus");
}

export async function basculerAllergene(allergeneId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  const allergene = await prisma.allergene.findFirst({ where: { id: allergeneId, garderieId: user.garderieId! } });
  if (!allergene) return;
  await prisma.allergene.update({ where: { id: allergeneId }, data: { actif: !allergene.actif } });
  revalidatePath("/direction/menus");
}

export async function creerTypeRepas(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const nom = (formData.get("nom") as string)?.trim();
  if (!nom) return;
  const nb = await prisma.typeRepas.count({ where: { garderieId: user.garderieId! } });
  await prisma.typeRepas.create({ data: { garderieId: user.garderieId!, nom, ordre: nb } }).catch(() => null);
  revalidatePath("/direction/menus");
}

export async function basculerTypeRepas(typeRepasId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  const type = await prisma.typeRepas.findFirst({ where: { id: typeRepasId, garderieId: user.garderieId! } });
  if (!type) return;
  await prisma.typeRepas.update({ where: { id: typeRepasId }, data: { actif: !type.actif } });
  revalidatePath("/direction/menus");
}

export async function creerAliment(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const nom = (formData.get("nom") as string)?.trim();
  const categorieAlimentaire = (formData.get("categorieAlimentaire") as string) || undefined;
  const description = (formData.get("description") as string) || undefined;
  const allergeneIds = formData.getAll("allergeneIds") as string[];
  if (!nom) return;

  const aliment = await prisma.aliment.create({
    data: { garderieId: user.garderieId!, nom, categorieAlimentaire, description },
  });
  if (allergeneIds.length > 0) {
    await prisma.alimentAllergene.createMany({
      data: allergeneIds.map((allergeneId) => ({ alimentId: aliment.id, allergeneId })),
    });
  }
  revalidatePath("/direction/menus");
}

export async function basculerAliment(alimentId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  const aliment = await prisma.aliment.findFirst({ where: { id: alimentId, garderieId: user.garderieId! } });
  if (!aliment) return;
  await prisma.aliment.update({ where: { id: alimentId }, data: { actif: !aliment.actif } });
  revalidatePath("/direction/menus");
}
