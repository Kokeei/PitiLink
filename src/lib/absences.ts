import { debutJournee } from "@/lib/format";
import type { TypeAbsence } from "@/generated/prisma/enums";

export const LIBELLES_TYPE_ABSENCE: Record<TypeAbsence, string> = {
  MALADIE: "🤒 Maladie",
  VACANCES: "🏖️ Vacances",
  GARDE_DOMICILE: "🏠 Garde à domicile",
  AUTRE: "Autre",
};

export type ReglesFacturationAbsence = {
  absenceDelaiPreavisJours: number;
  absenceMaladieCertificatDecompte: boolean;
  absenceMaladieSansCertificatDecompte: boolean;
};

export type ImpactFacturation = "DECOMPTEE" | "FACTUREE";

/**
 * Calcule l'incidence financière d'une absence à partir des règles propres à
 * la garderie (paramétrables, car chaque structure a son propre fonctionnement).
 *
 * Règle générale : une absence est décomptée de la facturation si elle est
 * déclarée avec au moins `absenceDelaiPreavisJours` jours de préavis avant
 * le premier jour d'absence. La maladie suit une règle dédiée basée sur la
 * présence (ou non) d'un certificat médical, qui prime sur le préavis.
 */
export function calculerImpactFacturation(
  absence: { type: TypeAbsence; dateDebut: Date; createdAt: Date; justificatifUrl: string | null },
  regles: ReglesFacturationAbsence
): { impact: ImpactFacturation; motif: string } {
  const aCertificat = !!absence.justificatifUrl;

  if (absence.type === "MALADIE") {
    if (aCertificat && regles.absenceMaladieCertificatDecompte) {
      return { impact: "DECOMPTEE", motif: "Maladie avec certificat médical" };
    }
    if (!aCertificat && regles.absenceMaladieSansCertificatDecompte) {
      return { impact: "DECOMPTEE", motif: "Maladie (règle de la garderie)" };
    }
    if (!aCertificat) {
      return { impact: "FACTUREE", motif: "Maladie sans certificat médical" };
    }
  }

  const preavisJours = Math.floor(
    (debutJournee(absence.dateDebut).getTime() - debutJournee(absence.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (preavisJours >= regles.absenceDelaiPreavisJours) {
    return { impact: "DECOMPTEE", motif: `Déclarée avec ${preavisJours} jour(s) de préavis` };
  }
  return {
    impact: "FACTUREE",
    motif:
      preavisJours <= 0
        ? "Déclarée le jour même (ou après le début de l'absence)"
        : `Préavis de ${preavisJours} jour(s), inférieur au minimum requis (${regles.absenceDelaiPreavisJours})`,
  };
}
