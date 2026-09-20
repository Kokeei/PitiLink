"use client";

import { useState } from "react";

export function Tabs({ tabs }: { tabs: { id: string; label: string; icone: string; content: React.ReactNode }[] }) {
  const [actif, setActif] = useState(tabs[0]?.id);
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
