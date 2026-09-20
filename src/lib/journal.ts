import { TypeJournalEvenement } from "@/generated/prisma/enums";

export const ICONES_EVENEMENT: Record<TypeJournalEvenement, string> = {
  ARRIVEE: "🏠",
  DEPART: "👋",
  BIBERON: "🍼",
  REPAS: "🍽️",
  CHANGE: "🧷",
  SIESTE: "😴",
  ACTIVITE: "🎨",
  HUMEUR: "😊",
  BAIN: "🛁",
  MEDICAMENT: "💊",
  INTERACTION: "🤝",
  INCIDENT: "⚠️",
  OBSERVATION: "📝",
  SORTIE: "🌳",
  AUTRE: "•",
};

export const LIBELLES_EVENEMENT: Record<TypeJournalEvenement, string> = {
  ARRIVEE: "Arrivée",
  DEPART: "Départ",
  BIBERON: "Biberon",
  REPAS: "Repas",
  CHANGE: "Change",
  SIESTE: "Sieste",
  ACTIVITE: "Activité",
  HUMEUR: "Humeur",
  BAIN: "Bain",
  MEDICAMENT: "Médicament",
  INTERACTION: "Interaction",
  INCIDENT: "Incident",
  OBSERVATION: "Observation",
  SORTIE: "Sortie",
  AUTRE: "Autre",
};

export const HUMEURS = [
  { valeur: "TRES_BIEN", icone: "😊", libelle: "Très bien" },
  { valeur: "BIEN", icone: "🙂", libelle: "Bien" },
  { valeur: "NORMAL", icone: "😐", libelle: "Normal" },
  { valeur: "FATIGUE", icone: "😴", libelle: "Fatigué" },
  { valeur: "TRISTE", icone: "😢", libelle: "Triste" },
  { valeur: "IRRITABLE", icone: "😡", libelle: "Irritable" },
  { valeur: "PAS_BIEN", icone: "🤒", libelle: "Pas bien" },
] as const;

export function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function resumeEvenement(type: TypeJournalEvenement, reelles: unknown): string {
  const d = reelles as Record<string, unknown> | null;
  if (!d) return "";
  switch (type) {
    case "BIBERON":
      return d.quantiteMl ? `${d.quantiteMl} ml` : "";
    case "REPAS":
      return typeof d.quantite === "string" ? d.quantite : "";
    case "CHANGE": {
      const parts: string[] = [];
      if (d.urine) parts.push("urine");
      if (d.selle) parts.push("selle");
      return parts.join(" + ") || "propre";
    }
    case "SIESTE":
      return d.heureDebut && d.heureFin ? `${d.heureDebut} → ${d.heureFin}` : "en cours";
    case "ACTIVITE":
      return typeof d.nom === "string" ? d.nom : "";
    case "HUMEUR": {
      const h = HUMEURS.find((h) => h.valeur === d.humeur);
      return h ? `${h.icone} ${h.libelle}` : "";
    }
    case "BAIN":
      return d.type === "douche" ? "Douche" : "Bain";
    default:
      return "";
  }
}
