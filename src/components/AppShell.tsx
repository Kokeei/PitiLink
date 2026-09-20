import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeconnexionButton } from "@/components/DeconnexionButton";
import { Sidebar, NavMobile } from "@/components/Sidebar";

type Item = { href: string; label: string; icone: string };

const LIBELLES_ROLE: Record<string, string> = {
  PARENT: "Parent",
  PROFESSIONNEL: "Professionnel",
  RESPONSABLE: "Responsable",
  DIRECTION: "Direction",
  ADMIN_PLATEFORME: "Administrateur",
};

function initiales(nom: string) {
  return nom
    .split(" ")
    .map((mot) => mot[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function AppShell({
  items,
  userId,
  userName,
  role,
  rechercheAction,
  children,
}: {
  items: Item[];
  userId: string;
  userName: string;
  role: string;
  rechercheAction?: string;
  children: React.ReactNode;
}) {
  const notificationsNonLues = await prisma.notification.count({ where: { userId, lu: false } });

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white p-4 md:flex">
        <Link href="/" className="mb-6 px-2">
          <p className="text-xl font-bold text-orange-600">🏠 PitiLink</p>
          <p className="text-xs text-stone-400">Notre petite grande crèche</p>
        </Link>
        <Sidebar items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3">
          {rechercheAction ? (
            <form action={rechercheAction} className="hidden flex-1 sm:block">
              <input
                name="q"
                placeholder="🔍 Rechercher un enfant, un parent..."
                className="w-full max-w-md rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm focus:border-orange-400 focus:outline-none"
              />
            </form>
          ) : (
            <div className="flex-1" />
          )}

          <div className="relative">
            <span className="text-xl">🔔</span>
            {notificationsNonLues > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {notificationsNonLues}
              </span>
            )}
          </div>

          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-1 hover:bg-stone-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                {initiales(userName)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight">{userName}</span>
                <span className="block text-xs leading-tight text-stone-400">{LIBELLES_ROLE[role] ?? role}</span>
              </span>
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-40 rounded-xl border border-stone-200 bg-white p-2 shadow-md">
              <DeconnexionButton />
            </div>
          </details>
        </header>

        <NavMobile items={items} />

        <main className="flex-1 bg-stone-50 px-4 py-4">{children}</main>
      </div>
    </div>
  );
}
