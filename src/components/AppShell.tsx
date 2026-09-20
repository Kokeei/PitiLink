import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeconnexionButton } from "@/components/DeconnexionButton";
import { Sidebar, NavMobile } from "@/components/Sidebar";
import { marquerNotificationsLues } from "@/app/actions";
import { formatDate } from "@/lib/format";
import { LIBELLES_ROLE } from "@/lib/badges";

type Item = { href: string; label: string; icone: string };

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
  const [notificationsNonLues, dernieresNotifications] = await Promise.all([
    prisma.notification.count({ where: { userId, lu: false } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

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

          <details className="relative">
            <summary className="relative flex cursor-pointer list-none items-center rounded-xl p-1 hover:bg-stone-50">
              <span className="text-xl">🔔</span>
              {notificationsNonLues > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {notificationsNonLues}
                </span>
              )}
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-80 max-w-[90vw] rounded-xl border border-stone-200 bg-white shadow-md">
              <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
                <p className="text-sm font-semibold">Notifications</p>
                {notificationsNonLues > 0 && (
                  <form action={marquerNotificationsLues}>
                    <button className="text-xs text-orange-600">Tout marquer comme lu</button>
                  </form>
                )}
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {dernieresNotifications.map((n) => {
                  const contenu = (
                    <div className={`px-3 py-2 text-sm ${n.lu ? "text-stone-500" : "font-medium text-stone-800"}`}>
                      <p>{n.contenu}</p>
                      <p className="text-xs text-stone-400">{formatDate(n.createdAt)}</p>
                    </div>
                  );
                  return (
                    <li key={n.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                      {n.lien ? <Link href={n.lien}>{contenu}</Link> : contenu}
                    </li>
                  );
                })}
                {dernieresNotifications.length === 0 && (
                  <li className="px-3 py-4 text-center text-sm text-stone-400">Aucune notification pour le moment.</li>
                )}
              </ul>
            </div>
          </details>

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
            <div className="absolute right-0 z-10 mt-2 w-44 rounded-xl border border-stone-200 bg-white p-2 shadow-md">
              <Link href="/compte" className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-50">
                🔑 Mon compte
              </Link>
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
