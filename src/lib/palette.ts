// Palette pastel partagée : utilisée pour les tuiles du jour, les badges de
// catégories de compétences, etc. Cycle par index plutôt que par nom, pour
// rester cohérent même si une garderie renomme ou ajoute des catégories.
export const PALETTE = [
  { bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  { bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  { bg: "bg-sky-50", text: "text-sky-700", badge: "bg-sky-100 text-sky-700" },
  { bg: "bg-pink-50", text: "text-pink-700", badge: "bg-pink-100 text-pink-700" },
  { bg: "bg-violet-50", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
  { bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
] as const;

export function couleurParIndex(i: number) {
  return PALETTE[i % PALETTE.length];
}
