import { formatHeure } from "@/lib/format";
import { parseJson, resumeEvenement } from "@/lib/journal";
import type { TypeJournalEvenement } from "@/generated/prisma/enums";

type Evenement = {
  type: TypeJournalEvenement;
  timestamp: Date;
  donneesReelles: string | null;
};

const TUILES: { type: TypeJournalEvenement; icone: string; label: string; bg: string }[] = [
  { type: "ARRIVEE", icone: "🏠", label: "Arrivée", bg: "bg-emerald-50" },
  { type: "REPAS", icone: "🍽️", label: "Repas", bg: "bg-orange-50" },
  { type: "SIESTE", icone: "😴", label: "Sieste", bg: "bg-sky-50" },
  { type: "CHANGE", icone: "🧷", label: "Change", bg: "bg-violet-50" },
  { type: "HUMEUR", icone: "😊", label: "Humeur", bg: "bg-pink-50" },
];

export function TuilesAujourdhui({ journal }: { journal: Evenement[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {TUILES.map((t) => {
        const evt = [...journal].reverse().find((e) => e.type === t.type || (t.type === "REPAS" && e.type === "BIBERON"));
        return (
          <div key={t.type} className={`stat-tile ${t.bg}`}>
            <p className="text-2xl">{t.icone}</p>
            <p className="mt-1 text-xs font-medium text-stone-500">{t.label}</p>
            <p className="text-sm font-semibold text-stone-700">
              {evt ? resumeEvenement(evt.type, parseJson(evt.donneesReelles)) || formatHeure(evt.timestamp) : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
