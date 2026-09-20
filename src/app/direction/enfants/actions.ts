"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { uploaderFichier } from "@/lib/blob";
import { reinitialiserMotDePasse } from "@/lib/comptes";
import type { StatutEnfant, TypeInfoImportante, LienFamilial, TypeDocument, AutorisationDiffusion, Sexe } from "@/generated/prisma/enums";

/**
 * Assistant d'ajout en une seule soumission (4 étapes côté formulaire :
 * identité, accueil, responsable, santé/sécurité) : tout est créé dans une
 * seule transaction pour ne jamais laisser une fiche à moitié créée.
 */
export async function creerEnfant(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const garderieId = user.garderieId!;

  // Étape 1 — Identité
  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const dateNaissance = formData.get("dateNaissance") as string;
  const sexe = (formData.get("sexe") as Sexe) || undefined;
  if (!prenom || !nom || !dateNaissance) return;

  // Étape 2 — Accueil
  const dateDebutAccueil = (formData.get("dateDebutAccueil") as string) || undefined;
  const groupeId = (formData.get("groupeId") as string) || undefined;
  const joursPresence = formData.getAll("joursPresence") as string[];
  const horaireHabituel = (formData.get("horaireHabituel") as string) || undefined;

  // Étape 3 — Responsable (facultatif)
  const parentPrenom = (formData.get("parentPrenom") as string) || "";
  const parentNom = (formData.get("parentNom") as string) || "";
  const parentEmail = (formData.get("parentEmail") as string) || "";
  const parentMotDePasse = (formData.get("parentMotDePasse") as string) || "";
  const parentTelephone = (formData.get("parentTelephone") as string) || undefined;
  const parentLien = (formData.get("parentLien") as LienFamilial) || "AUTRE";

  // Étape 4 — Santé / sécurité (facultatif)
  const allergeneIds = formData.getAll("allergeneIds") as string[];
  const infoDescription = (formData.get("infoDescription") as string) || "";
  const traitementNom = (formData.get("traitementNom") as string) || "";
  const traitementDateFin = (formData.get("traitementDateFin") as string) || "";
  const urgencePrenom = (formData.get("urgencePrenom") as string) || "";
  const urgenceNom = (formData.get("urgenceNom") as string) || "";
  const urgenceTelephone = (formData.get("urgenceTelephone") as string) || "";
  const urgenceLien = (formData.get("urgenceLien") as string) || "Autre";

  const enfantId = await prisma.$transaction(async (tx) => {
    const enfant = await tx.enfant.create({
      data: {
        garderieId,
        prenom,
        nom,
        dateNaissance: new Date(dateNaissance),
        sexe,
        groupeId,
        dateInscription: new Date(),
        dateDebutAccueil: dateDebutAccueil ? new Date(dateDebutAccueil) : undefined,
        joursPresence,
        horaireHabituel,
        statut: "ACTIF",
      },
    });

    if (parentPrenom && parentNom && parentEmail && parentMotDePasse) {
      const passwordHash = await bcrypt.hash(parentMotDePasse, 10);
      const parent = await tx.user.create({
        data: { prenom: parentPrenom, nom: parentNom, email: parentEmail, telephone: parentTelephone, passwordHash, role: "PARENT", garderieId },
      });
      await tx.parentEnfant.create({
        data: { enfantId: enfant.id, userId: parent.id, lien: parentLien, estContactUrgence: true },
      });
    }

    if (allergeneIds.length > 0) {
      const allergenesValides = await tx.allergene.findMany({ where: { id: { in: allergeneIds }, garderieId } });
      if (allergenesValides.length > 0) {
        await tx.allergieEnfant.createMany({
          data: allergenesValides.map((a) => ({ enfantId: enfant.id, allergeneId: a.id })),
        });
        await tx.historiqueEnfant.createMany({
          data: allergenesValides.map((a) => ({ enfantId: enfant.id, titre: `Allergie ajoutée : ${a.nom}` })),
        });
      }
    }

    if (infoDescription) {
      await tx.infoImportante.create({
        data: { enfantId: enfant.id, type: "AUTRE", titre: "Information importante", description: infoDescription, critique: false },
      });
    }

    if (traitementNom && traitementDateFin) {
      await tx.traitement.create({
        data: { enfantId: enfant.id, nom: traitementNom, dateFin: new Date(traitementDateFin) },
      });
    }

    if (urgencePrenom && urgenceNom && urgenceTelephone) {
      await tx.contactUrgence.create({
        data: { enfantId: enfant.id, prenom: urgencePrenom, nom: urgenceNom, telephone: urgenceTelephone, lien: urgenceLien, ordrePriorite: 1 },
      });
    }

    return enfant.id;
  });

  revalidatePath("/direction/enfants");
  redirect(`/direction/enfants/${enfantId}`);
}

const MAX_PARENTS = 2;

/**
 * Enregistre en un seul clic : statut, groupe, adresse, et les coordonnées
 * de chaque parent déjà lié (identifiés par leur ParentEnfant.id, transmis
 * en input caché côté formulaire).
 */
export async function modifierFicheEnfant(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);

  const enfant = await prisma.enfant.findFirst({
    where: { id: enfantId, garderieId: user.garderieId! },
    include: { parents: true },
  });
  if (!enfant) return;

  const prenom = (formData.get("prenom") as string) || enfant.prenom;
  const nom = (formData.get("nom") as string) || enfant.nom;
  const dateNaissance = (formData.get("dateNaissance") as string) || undefined;
  const sexe = (formData.get("sexe") as Sexe) || null;
  const dateDebutAccueil = (formData.get("dateDebutAccueil") as string) || undefined;
  const statut = formData.get("statut") as StatutEnfant;
  const groupeId = (formData.get("groupeId") as string) || null;
  const adresse = (formData.get("adresse") as string) || null;
  const autorisationPhotos = formData.get("autorisationPhotos") as AutorisationDiffusion;

  await prisma.enfant.update({
    where: { id: enfantId },
    data: {
      prenom,
      nom,
      dateNaissance: dateNaissance ? new Date(dateNaissance) : undefined,
      sexe,
      dateDebutAccueil: dateDebutAccueil ? new Date(dateDebutAccueil) : undefined,
      statut,
      groupeId,
      adresse,
      autorisationPhotos,
    },
  });

  if (groupeId !== enfant.groupeId) {
    const [ancien, nouveau] = await Promise.all([
      enfant.groupeId ? prisma.groupe.findUnique({ where: { id: enfant.groupeId } }) : null,
      groupeId ? prisma.groupe.findUnique({ where: { id: groupeId } }) : null,
    ]);
    await prisma.historiqueEnfant.create({
      data: { enfantId, titre: `Changement de groupe : ${ancien?.nom ?? "Sans groupe"} → ${nouveau?.nom ?? "Sans groupe"}` },
    });
  }

  for (const p of enfant.parents) {
    const prenom = formData.get(`parent_${p.id}_prenom`) as string | null;
    const nom = formData.get(`parent_${p.id}_nom`) as string | null;
    const email = formData.get(`parent_${p.id}_email`) as string | null;
    const telephone = (formData.get(`parent_${p.id}_telephone`) as string) || null;
    const lien = formData.get(`parent_${p.id}_lien`) as LienFamilial | null;
    if (!prenom || !nom || !email || !lien) continue;

    await prisma.user.update({ where: { id: p.userId }, data: { prenom, nom, email, telephone } });
    await prisma.parentEnfant.update({ where: { id: p.id }, data: { lien } });
  }

  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath("/direction/enfants");
}

export async function ajouterParent(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const email = formData.get("email") as string;
  const telephone = (formData.get("telephone") as string) || undefined;
  const motDePasse = formData.get("motDePasse") as string;
  const lien = formData.get("lien") as LienFamilial;
  const estContactUrgence = formData.get("estContactUrgence") === "on";
  if (!prenom || !nom || !email || !motDePasse) return;

  const enfant = await prisma.enfant.findFirst({
    where: { id: enfantId, garderieId: user.garderieId! },
    include: { _count: { select: { parents: true } } },
  });
  if (!enfant || enfant._count.parents >= MAX_PARENTS) return;

  const passwordHash = await bcrypt.hash(motDePasse, 10);

  const parent = await prisma.user.create({
    data: {
      prenom,
      nom,
      email,
      telephone,
      passwordHash,
      role: "PARENT",
      garderieId: user.garderieId!,
    },
  });

  if (estContactUrgence) {
    await prisma.parentEnfant.updateMany({ where: { enfantId }, data: { estContactUrgence: false } });
  }

  await prisma.parentEnfant.create({
    data: { enfantId, userId: parent.id, lien, estContactUrgence },
  });

  revalidatePath(`/direction/enfants/${enfantId}`);
}

export async function definirContactUrgencePrincipal(enfantId: string, parentEnfantId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  const lienParent = await prisma.parentEnfant.findFirst({
    where: { id: parentEnfantId, enfantId, enfant: { garderieId: user.garderieId! } },
  });
  if (!lienParent) return;

  await prisma.parentEnfant.updateMany({ where: { enfantId }, data: { estContactUrgence: false } });
  await prisma.parentEnfant.update({ where: { id: parentEnfantId }, data: { estContactUrgence: true } });

  revalidatePath(`/direction/enfants/${enfantId}`);
}

export async function reinitialiserMotDePasseParent(parentUserId: string, parentEnfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const nouveauMotDePasse = formData.get(`nouveauMotDePasse_${parentEnfantId}`) as string;
  await reinitialiserMotDePasse(user.garderieId!, parentUserId, nouveauMotDePasse);
}

export async function retirerParent(enfantId: string, parentEnfantId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.parentEnfant.deleteMany({
    where: { id: parentEnfantId, enfantId, enfant: { garderieId: user.garderieId! } },
  });
  revalidatePath(`/direction/enfants/${enfantId}`);
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

/**
 * Allergie structurée (liée à un allergène configurable) : c'est celle-ci
 * que le module Menus utilise pour détecter automatiquement les conflits
 * alimentaires. Distincte des informations importantes en texte libre.
 */
export async function ajouterAllergieEnfant(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const allergeneId = formData.get("allergeneId") as string;
  const note = (formData.get("note") as string) || undefined;
  if (!allergeneId) return;

  const [enfant, allergene] = await Promise.all([
    prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } }),
    prisma.allergene.findFirst({ where: { id: allergeneId, garderieId: user.garderieId! } }),
  ]);
  if (!enfant || !allergene) return;

  await prisma.allergieEnfant.upsert({
    where: { enfantId_allergeneId: { enfantId, allergeneId } },
    create: { enfantId, allergeneId, note },
    update: { note },
  });
  await prisma.historiqueEnfant.create({
    data: { enfantId, titre: `Allergie ajoutée : ${allergene.nom}` },
  });

  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath("/direction/menus");
}

export async function supprimerAllergieEnfant(enfantId: string, allergieId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.allergieEnfant.deleteMany({ where: { id: allergieId, enfant: { garderieId: user.garderieId! } } });
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath("/direction/menus");
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

export async function modifierPhotoEnfant(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const fichier = formData.get("photo") as File | null;

  const enfant = await prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } });
  if (!enfant || enfant.autorisationPhotos !== "AUTORISEE") return;

  const url = await uploaderFichier(fichier, `enfants/${enfantId}/profil`);
  if (!url) return;

  await prisma.enfant.update({ where: { id: enfantId }, data: { photoUrl: url } });
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath("/direction/enfants");
  revalidatePath(`/pro/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
}

export async function ajouterPhotoSouvenir(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const fichier = formData.get("photo") as File | null;
  const legende = (formData.get("legende") as string) || undefined;

  const enfant = await prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } });
  if (!enfant || enfant.autorisationPhotos !== "AUTORISEE") return;

  const url = await uploaderFichier(fichier, `enfants/${enfantId}/souvenirs`);
  if (!url) return;

  await prisma.photo.create({
    data: { garderieId: enfant.garderieId, enfantId, url, legende, auteurId: user.id },
  });
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
}

export async function supprimerPhotoSouvenir(enfantId: string, photoId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.photo.deleteMany({ where: { id: photoId, enfantId, garderieId: user.garderieId! } });
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
}

export async function ajouterDocument(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const fichier = formData.get("fichier") as File | null;
  const nom = formData.get("nom") as string;
  const type = formData.get("type") as TypeDocument;
  if (!nom) return;

  const enfant = await prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } });
  if (!enfant) return;

  const url = await uploaderFichier(fichier, `enfants/${enfantId}/documents`);
  if (!url) return;

  await prisma.document.create({
    data: { garderieId: enfant.garderieId, enfantId, nom, type, url },
  });
  await prisma.historiqueEnfant.create({ data: { enfantId, titre: `Document ajouté : ${nom}` } });
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
}

export async function supprimerDocument(enfantId: string, documentId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.document.deleteMany({ where: { id: documentId, enfantId, garderieId: user.garderieId! } });
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath(`/parent/enfants/${enfantId}`);
}

// --- En-tête de fiche : "Plus d'actions" ----------------------------------

export async function changerStatutEnfant(enfantId: string, nouveauStatut: StatutEnfant) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.enfant.updateMany({ where: { id: enfantId, garderieId: user.garderieId! }, data: { statut: nouveauStatut } });
  revalidatePath(`/direction/enfants/${enfantId}`);
  revalidatePath("/direction/enfants");
}

// --- Onglet Général : Accueil (jours de présence, horaires) ---------------

export async function modifierAccueil(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const joursPresence = formData.getAll("joursPresence") as string[];
  const horaireHabituel = (formData.get("horaireHabituel") as string) || null;

  await prisma.enfant.updateMany({
    where: { id: enfantId, garderieId: user.garderieId! },
    data: { joursPresence, horaireHabituel },
  });
  revalidatePath(`/direction/enfants/${enfantId}`);
}

// --- Onglet Général : Personnes autorisées ---------------------------------

export async function ajouterPersonneAutorisee(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const lien = formData.get("lien") as string;
  const telephone = (formData.get("telephone") as string) || undefined;
  const ponctuelle = formData.get("ponctuelle") === "on";
  if (!prenom || !nom || !lien) return;

  const enfant = await prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } });
  if (!enfant) return;

  await prisma.personneAutorisee.create({ data: { enfantId, prenom, nom, lien, telephone, ponctuelle } });
  await prisma.historiqueEnfant.create({ data: { enfantId, titre: `Personne autorisée ajoutée : ${prenom} ${nom}` } });
  revalidatePath(`/direction/enfants/${enfantId}`);
}

export async function supprimerPersonneAutorisee(enfantId: string, personneId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.personneAutorisee.deleteMany({ where: { id: personneId, enfant: { id: enfantId, garderieId: user.garderieId! } } });
  revalidatePath(`/direction/enfants/${enfantId}`);
}

// --- Onglet Santé : traitement, médecin traitant ---------------------------

export async function ajouterTraitement(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const nom = formData.get("nom") as string;
  const dateFin = formData.get("dateFin") as string;
  const note = (formData.get("note") as string) || undefined;
  if (!nom || !dateFin) return;

  const enfant = await prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } });
  if (!enfant) return;

  await prisma.traitement.create({ data: { enfantId, nom, dateFin: new Date(dateFin), note } });
  revalidatePath(`/direction/enfants/${enfantId}`);
}

export async function supprimerTraitement(enfantId: string, traitementId: string) {
  const user = await requireUser(ROLES_DIRECTION);
  await prisma.traitement.deleteMany({ where: { id: traitementId, enfant: { id: enfantId, garderieId: user.garderieId! } } });
  revalidatePath(`/direction/enfants/${enfantId}`);
}

export async function modifierMedecin(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const medecinNom = (formData.get("medecinNom") as string) || null;
  const medecinTelephone = (formData.get("medecinTelephone") as string) || null;
  await prisma.enfant.updateMany({ where: { id: enfantId, garderieId: user.garderieId! }, data: { medecinNom, medecinTelephone } });
  revalidatePath(`/direction/enfants/${enfantId}`);
}
