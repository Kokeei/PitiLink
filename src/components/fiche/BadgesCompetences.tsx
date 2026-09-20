import { couleurParIndex } from "@/lib/palette";

export function BadgesCompetences({
  badges,
  lienVoirTout,
}: {
  badges: { id: string; nom: string; icone: string | null; total: number }[];
  lienVoirTout?: string;
}) {
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold">🌱 Compétences et développement</p>
        {lienVoirTout && (
          <a href={lienVoirTout} className="text-sm text-orange-600">
            Voir tout →
          </a>
        )}
      </div>
      <p className="text-xs text-stone-400">
        Outil d&apos;observation : « à venir » signifie seulement qu&apos;aucune compétence de cette catégorie
        n&apos;a encore été enregistrée.
      </p>
      <div className="flex flex-wrap gap-3">
        {badges.map((b, i) => {
          const c = couleurParIndex(i);
          return (
            <div key={b.id} className="flex w-20 flex-col items-center gap-1 text-center">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${c.bg}`}>
                {b.icone ?? "🌱"}
              </div>
              <p className="text-xs font-medium text-stone-600">{b.nom}</p>
              <span className={`pill text-[11px] ${b.total > 0 ? c.badge : "bg-stone-100 text-stone-400"}`}>
                {b.total > 0 ? "En cours" : "À venir"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
