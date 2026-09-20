"use client";

import { useEffect, useState } from "react";

/**
 * Onglet initial optionnel via l'ancre d'URL (#onglet-<id>) : permet à un
 * lien externe (ex. le bouton "Modifier" de la liste, ou une navigation
 * "veille/lendemain" qui recharge toute la page) de rouvrir directement le
 * bon onglet plutôt que de retomber sur le premier par défaut.
 */
export function Tabs({ tabs }: { tabs: { id: string; label: string; icone: string; content: React.ReactNode }[] }) {
  const [actif, setActif] = useState(tabs[0]?.id);

  useEffect(() => {
    function appliquerHash() {
      const hash = window.location.hash.replace("#onglet-", "");
      if (hash && tabs.some((t) => t.id === hash)) setActif(hash);
    }
    appliquerHash();
    window.addEventListener("hashchange", appliquerHash);
    return () => window.removeEventListener("hashchange", appliquerHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onglet = tabs.find((t) => t.id === actif) ?? tabs[0];

  return (
    <div>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActif(t.id)} className={t.id === actif ? "tab-item-active" : "tab-item"}>
            {t.icone} {t.label}
          </button>
        ))}
      </div>
      {onglet?.content}
    </div>
  );
}
