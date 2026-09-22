export type LienNav = { href: string; label: string; icone: string };

export const LIENS_ADMIN: LienNav[] = [
  { href: "/admin", label: "Délégations", icone: "🛡️" },
];

export const LIENS_DIRECTION: LienNav[] = [
  { href: "/direction", label: "Tableau de bord", icone: "📊" },
  { href: "/direction/enfants", label: "Enfants", icone: "👶" },
  { href: "/direction/absences", label: "Absences", icone: "🏖️" },
  { href: "/direction/groupes", label: "Groupes", icone: "👥" },
  { href: "/direction/professionnels", label: "Professionnels", icone: "🧑‍🏫" },
  { href: "/direction/affectations", label: "Affectations", icone: "🔗" },
  { href: "/direction/menus", label: "Menus", icone: "🍽️" },
  { href: "/direction/competences", label: "Compétences", icone: "🌱" },
];

export const LIENS_PRO: LienNav[] = [
  { href: "/pro", label: "Aujourd'hui", icone: "🏠" },
  { href: "/pro/groupe", label: "Groupe", icone: "👥" },
  { href: "/pro/menus", label: "Menus", icone: "🍽️" },
];

export const LIENS_PARENT: LienNav[] = [
  { href: "/parent", label: "Mes enfants", icone: "👶" },
  { href: "/parent/absences", label: "Absences", icone: "🏖️" },
];
