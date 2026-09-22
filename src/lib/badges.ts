// Mappings couleur/libellé partagés entre pages, pour éviter que chaque
// écran redéfinisse localement sa propre version (et finisse par diverger).

export const LIBELLES_ROLE: Record<string, string> = {
  PARENT: "Parent",
  PROFESSIONNEL: "Professionnel",
  RESPONSABLE: "Responsable",
  DIRECTION: "Direction",
  ADMIN_PLATEFORME: "Administrateur",
};

export const ROLE_PILL: Record<string, string> = {
  PROFESSIONNEL: "bg-blue-100 text-blue-700",
  RESPONSABLE: "bg-violet-100 text-violet-700",
  DIRECTION: "bg-orange-100 text-orange-700",
  PARENT: "bg-emerald-100 text-emerald-700",
  ADMIN_PLATEFORME: "bg-stone-800 text-white",
};

export const STATUTS_ENFANT_PILL: Record<string, string> = {
  ACTIF: "bg-green-100 text-green-700",
  SUSPENDU: "bg-amber-100 text-amber-700",
  SORTI: "bg-stone-200 text-stone-600",
  ARCHIVE: "bg-stone-200 text-stone-500",
};
