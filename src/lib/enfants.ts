// Logique pure (sans Prisma) pour la fiche enfant : séparation traitements
// en cours / terminés, regroupement des documents par catégorie, et fusion
// de l'historique — testable unitairement sans base de données.

export type Traitement = {
  id: string;
  nom: string;
  dateDebut: Date | null;
  dateFin: Date;
  note: string | null;
};

/**
 * "En cours" / "terminé" est calculé à partir de dateFin, jamais stocké :
 * un traitement dont la date de fin est dépassée bascule automatiquement
 * dans l'historique, sans action manuelle (§ onglet Santé du cahier des
 * charges : "une fois la date de fin dépassée, retirer automatiquement").
 */
export function traitementsEnCours(traitements: Traitement[], maintenant: Date = new Date()): Traitement[] {
  return traitements.filter((t) => t.dateFin.getTime() >= maintenant.getTime());
}

export function traitementsTermines(traitements: Traitement[], maintenant: Date = new Date()): Traitement[] {
  return traitements.filter((t) => t.dateFin.getTime() < maintenant.getTime());
}

export type CategorieDocument = "ADMINISTRATIF" | "SANTE" | "AUTRES";

const CATEGORIE_PAR_TYPE: Record<string, CategorieDocument> = {
  CONTRAT: "ADMINISTRATIF",
  AUTORISATION: "ADMINISTRATIF",
  JUSTIFICATIF: "ADMINISTRATIF",
  ORDONNANCE: "SANTE",
  AUTRE: "AUTRES",
};

export const LIBELLES_CATEGORIE_DOCUMENT: Record<CategorieDocument, string> = {
  ADMINISTRATIF: "Administratif",
  SANTE: "Santé",
  AUTRES: "Autres",
};

export function categorieDocument(type: string): CategorieDocument {
  return CATEGORIE_PAR_TYPE[type] ?? "AUTRES";
}

export function documentsParCategorie<T extends { type: string }>(documents: T[]): Record<CategorieDocument, T[]> {
  const groupes: Record<CategorieDocument, T[]> = { ADMINISTRATIF: [], SANTE: [], AUTRES: [] };
  for (const d of documents) groupes[categorieDocument(d.type)].push(d);
  return groupes;
}

export type EvenementHistorique = { id: string; date: Date; titre: string; description: string | null };

/**
 * Fusionne les événements enregistrés (HistoriqueEnfant) avec les
 * traitements terminés (calculés, jamais stockés comme événement séparé)
 * et trie le tout du plus récent au plus ancien.
 */
export function construireHistorique(
  evenements: EvenementHistorique[],
  traitements: Traitement[],
  maintenant: Date = new Date()
): EvenementHistorique[] {
  const traitementsFinis = traitementsTermines(traitements, maintenant).map((t) => ({
    id: `traitement-${t.id}`,
    date: t.dateFin,
    titre: `Traitement terminé : ${t.nom}`,
    description: t.note,
  }));

  return [...evenements, ...traitementsFinis].sort((a, b) => b.date.getTime() - a.date.getTime());
}
