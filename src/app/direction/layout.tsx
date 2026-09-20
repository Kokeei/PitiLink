import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { AppShell } from "@/components/AppShell";

const LIENS = [
  { href: "/direction", label: "Tableau de bord", icone: "📊" },
  { href: "/direction/enfants", label: "Enfants", icone: "👶" },
  { href: "/direction/absences", label: "Absences", icone: "🏖️" },
  { href: "/direction/groupes", label: "Groupes", icone: "👥" },
  { href: "/direction/professionnels", label: "Professionnels", icone: "🧑‍🏫" },
  { href: "/direction/affectations", label: "Affectations", icone: "🔗" },
  { href: "/direction/menus", label: "Menus", icone: "🍽️" },
  { href: "/direction/competences", label: "Compétences", icone: "🌱" },
];

export default async function DirectionLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(ROLES_DIRECTION);

  return (
    <AppShell items={LIENS} userId={user.id} userName={user.name ?? ""} role={user.role} rechercheAction="/direction/enfants">
      {children}
    </AppShell>
  );
}
