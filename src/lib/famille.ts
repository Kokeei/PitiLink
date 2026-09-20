import type { LienFamilial } from "@/generated/prisma/enums";

// Le lien est choisi librement pour chaque parent (indépendamment l'un de
// l'autre) : deux "Papa" ou deux "Maman" sont possibles, pour couvrir aussi
// les familles homoparentales.
export const LIBELLES_LIEN: Record<LienFamilial, string> = {
  MERE: "Maman",
  PERE: "Papa",
  TUTEUR: "Tuteur / tutrice",
  AUTRE: "Autre",
};

export const OPTIONS_LIEN: { valeur: LienFamilial; libelle: string }[] = [
  { valeur: "MERE", libelle: "Maman" },
  { valeur: "PERE", libelle: "Papa" },
  { valeur: "TUTEUR", libelle: "Tuteur / tutrice" },
  { valeur: "AUTRE", libelle: "Autre" },
];
