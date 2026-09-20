import { prisma } from "@/lib/prisma";
import { ageEnMois } from "@/lib/format";

// Marge autour de l'âge indicatif pour les suggestions : purement pratique
// (aider au classement), jamais utilisée pour juger un retard ou une avance.
const MARGE_SUGGESTION_MOIS_AVANT = 3;
const MARGE_SUGGESTION_MOIS_APRES = 6;
const NB_SUGGESTIONS = 6;

export async function getCatalogueGroupe(garderieId: string) {
  return prisma.categorieCompetence.findMany({
    where: { garderieId, actif: true },
    include: { competences: { where: { actif: true }, orderBy: { ordreAffichage: "asc" } } },
    orderBy: { ordre: "asc" },
  });
}

export async function getSuggestionsCompetences(enfantId: string, garderieId: string, dateNaissance: Date) {
  const age = ageEnMois(dateNaissance);

  const [dejaAcquises, competences] = await Promise.all([
    prisma.acquisitionCompetence.findMany({ where: { enfantId }, select: { competenceId: true } }),
    prisma.competence.findMany({
      where: { garderieId, actif: true },
      include: { categorie: true },
      orderBy: { ordreAffichage: "asc" },
    }),
  ]);

  const idsAcquis = new Set(dejaAcquises.map((a) => a.competenceId));

  return competences
    .filter((c) => !idsAcquis.has(c.id))
    .filter((c) => {
      if (c.ageIndicatifMoisMin == null && c.ageIndicatifMoisMax == null) return true;
      const min = (c.ageIndicatifMoisMin ?? 0) - MARGE_SUGGESTION_MOIS_AVANT;
      const max = (c.ageIndicatifMoisMax ?? Infinity) + MARGE_SUGGESTION_MOIS_APRES;
      return age >= min && age <= max;
    })
    .slice(0, NB_SUGGESTIONS);
}

export async function getAcquisitionsEnfant(enfantId: string, categorieId?: string) {
  return prisma.acquisitionCompetence.findMany({
    where: { enfantId, ...(categorieId ? { competence: { categorieId } } : {}) },
    include: {
      competence: { include: { categorie: true } },
      auteur: { select: { prenom: true, nom: true } },
      modifiePar: { select: { prenom: true, nom: true } },
    },
    orderBy: { dateObservation: "desc" },
  });
}

export async function getResumeParCategorie(enfantId: string) {
  const acquisitions = await prisma.acquisitionCompetence.findMany({
    where: { enfantId },
    include: { competence: { include: { categorie: true } } },
  });

  const parCategorie = new Map<string, { nom: string; icone: string | null; total: number }>();
  for (const a of acquisitions) {
    const cat = a.competence.categorie;
    const existant = parCategorie.get(cat.id);
    if (existant) {
      existant.total += 1;
    } else {
      parCategorie.set(cat.id, { nom: cat.nom, icone: cat.icone, total: 1 });
    }
  }

  return {
    total: acquisitions.length,
    parCategorie: Array.from(parCategorie.values()).sort((a, b) => b.total - a.total),
  };
}
