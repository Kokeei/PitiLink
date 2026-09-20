import { debutJournee } from "@/lib/format";
import type { PorteeMenu } from "@/generated/prisma/enums";

/**
 * Index de jour spécifique au module Menus : 0 = lundi ... 4 = vendredi.
 * Ne pas confondre avec Affectation.joursSemaine (0 = dimanche ... 6 = samedi) :
 * les menus ne concernent que les jours d'ouverture Lundi→Vendredi.
 */
export const JOURS_MENU = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;

/** Renvoie le lundi (00:00) de la semaine contenant `date`. */
export function lundiDeLaSemaine(date: Date = new Date()): Date {
  const d = debutJournee(date);
  const jour = d.getDay(); // 0 = dimanche ... 6 = samedi
  const decalage = jour === 0 ? -6 : 1 - jour;
  d.setDate(d.getDate() + decalage);
  return d;
}

export type ComposantResolu = {
  id: string;
  alimentId: string;
  alimentNom: string;
  ordre: number;
  remplaceAlimentNom: string | null;
  motifRemplacement: string | null;
};

export type EntreeMenu = {
  id: string;
  jourSemaine: number;
  typeRepasId: string;
  portee: PorteeMenu;
  groupeId: string | null;
  enfantId: string | null;
  note: string | null;
  composants: ComposantResolu[];
};

export type MenuResolu = {
  portee: PorteeMenu;
  entreeId: string;
  note: string | null;
  composants: ComposantResolu[];
};

/**
 * Détermine le menu réellement applicable à un enfant pour un jour/repas
 * donné, en appliquant la priorité individuel > catégorie > général.
 * Retourne `null` si aucun menu n'a été défini à aucun des trois niveaux.
 */
export function resoudreMenuEnfant(
  entrees: EntreeMenu[],
  enfant: { id: string; groupeId: string | null },
  jourSemaine: number,
  typeRepasId: string
): MenuResolu | null {
  const candidates = entrees.filter((e) => e.jourSemaine === jourSemaine && e.typeRepasId === typeRepasId);

  const individuel = candidates.find((e) => e.portee === "INDIVIDUEL" && e.enfantId === enfant.id);
  if (individuel) {
    return { portee: "INDIVIDUEL", entreeId: individuel.id, note: individuel.note, composants: individuel.composants };
  }

  if (enfant.groupeId) {
    const categorie = candidates.find((e) => e.portee === "CATEGORIE" && e.groupeId === enfant.groupeId);
    if (categorie) {
      return { portee: "CATEGORIE", entreeId: categorie.id, note: categorie.note, composants: categorie.composants };
    }
  }

  const general = candidates.find((e) => e.portee === "GENERAL");
  if (general) {
    return { portee: "GENERAL", entreeId: general.id, note: general.note, composants: general.composants };
  }

  return null;
}

export type ConflitAllergie = {
  enfantId: string;
  enfantNom: string;
  allergeneNom: string;
  alimentNom: string;
};

/**
 * Détecte, parmi une liste de composants (aliments servis) et d'enfants
 * concernés par ce menu (tous les enfants actifs pour un menu général, ceux
 * du groupe pour un menu catégorie, un seul enfant pour un menu individuel),
 * les conflits entre allergènes déclarés et aliments servis.
 */
export function detecterConflitsAllergie(
  composants: { alimentId: string; alimentNom: string; allergeneIds: string[] }[],
  enfants: { id: string; nomComplet: string; allergies: { allergeneId: string; allergeneNom: string }[] }[]
): ConflitAllergie[] {
  const conflits: ConflitAllergie[] = [];

  for (const enfant of enfants) {
    if (enfant.allergies.length === 0) continue;
    for (const composant of composants) {
      for (const allergie of enfant.allergies) {
        if (composant.allergeneIds.includes(allergie.allergeneId)) {
          conflits.push({
            enfantId: enfant.id,
            enfantNom: enfant.nomComplet,
            allergeneNom: allergie.allergeneNom,
            alimentNom: composant.alimentNom,
          });
        }
      }
    }
  }

  return conflits;
}
