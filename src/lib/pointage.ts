// Pointage rapide depuis la liste « Mes enfants aujourd'hui » (espace pro).
// Logique pure : quel bouton afficher sur la carte d'un enfant selon sa présence du jour.

export type EtatPointage =
  | { etape: "arrivee" } // pas encore arrivé : bouton « Arrivée »
  | { etape: "depart"; heureArrivee: Date } // présent : bouton « Départ »
  | { etape: "parti"; heureArrivee: Date | null; heureDepart: Date } // journée terminée
  | { etape: "absent" }; // absence déclarée : pas de bouton

type PresenceDuJour = {
  statut: "PREVU" | "PRESENT" | "ABSENT" | "A_CONFIRMER";
  heureArrivee: Date | null;
  heureDepart: Date | null;
} | null;

export function etatPointage(presence: PresenceDuJour): EtatPointage {
  if (!presence) return { etape: "arrivee" };
  if (presence.statut === "ABSENT") return { etape: "absent" };
  if (presence.heureDepart) {
    return { etape: "parti", heureArrivee: presence.heureArrivee, heureDepart: presence.heureDepart };
  }
  if (presence.heureArrivee) return { etape: "depart", heureArrivee: presence.heureArrivee };
  return { etape: "arrivee" };
}
