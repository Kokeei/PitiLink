import Link from "next/link";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { DeconnexionButton } from "@/components/DeconnexionButton";

const LIENS = [
  { href: "/direction", label: "📊 Tableau de bord" },
  { href: "/direction/enfants", label: "👶 Enfants" },
  { href: "/direction/groupes", label: "👥 Groupes" },
  { href: "/direction/professionnels", label: "🧑‍🏫 Professionnels" },
  { href: "/direction/affectations", label: "🔗 Affectations" },
  { href: "/direction/menus", label: "🍽️ Menus" },
];

export default async function DirectionLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(ROLES_DIRECTION);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
        <div>
          <p className="font-bold text-orange-600">PitiLink</p>
          <p className="text-xs text-stone-500">{user.name} · Direction</p>
        </div>
        <DeconnexionButton />
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-stone-200 bg-white px-2 py-2 text-sm font-medium">
        {LIENS.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 hover:bg-stone-100">
            {l.label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 bg-stone-50 px-4 py-4">{children}</main>
    </div>
  );
}
