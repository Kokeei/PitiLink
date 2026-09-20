"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icone: string };

function estActif(pathname: string, href: string) {
  const racines = ["/pro", "/parent", "/direction"];
  if (racines.includes(href)) return href === pathname;
  return pathname.startsWith(href);
}

export function Sidebar({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:block md:space-y-1">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={estActif(pathname, item.href) ? "nav-item-active" : "nav-item"}>
          <span className="text-lg">{item.icone}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function NavMobile({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-white px-2 py-2 md:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
            estActif(pathname, item.href) ? "bg-orange-100 text-orange-700" : "text-stone-600"
          }`}
        >
          {item.icone} {item.label}
        </Link>
      ))}
    </nav>
  );
}
