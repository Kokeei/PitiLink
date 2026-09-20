// Palette catégorielle validée (accessibilité daltonisme + contraste) — ordre
// fixe, jamais recomposé par valeur. Voir skill "dataviz".
const CATEGORICAL = [
  "#2a78d6", // bleu
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // jaune
  "#e87ba4", // magenta
  "#008300", // vert
  "#4a3aa7", // violet
  "#e34948", // rouge
];

export function DonutChart({
  segments,
  centreValeur,
  centreLabel,
}: {
  segments: { label: string; value: number }[];
  centreValeur: number | string;
  centreLabel: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const rayon = 42;
  const circonference = 2 * Math.PI * rayon;
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 3 : 0;

  const longueurs = segments.map((s) => (total > 0 ? (s.value / total) * circonference : 0));
  const offsets = longueurs.reduce<number[]>((acc, longueur, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + longueurs[i - 1]);
    return acc;
  }, []);
  const arcs = segments.map((s, i) => {
    const dash = Math.max(longueurs[i] - gap, 0);
    return (
      <circle
        key={s.label}
        cx="50"
        cy="50"
        r={rayon}
        fill="none"
        stroke={CATEGORICAL[i % CATEGORICAL.length]}
        strokeWidth="14"
        strokeDasharray={`${dash} ${circonference - dash}`}
        strokeDashoffset={-offsets[i]}
      />
    );
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={rayon} fill="none" stroke="#e7e5e4" strokeWidth="14" />
          {arcs}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-stone-800">{centreValeur}</span>
          <span className="text-[11px] text-stone-500">{centreLabel}</span>
        </div>
      </div>
      <ul className="space-y-1 text-sm">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORICAL[i % CATEGORICAL.length] }} />
            <span className="text-stone-600">{s.label}</span>
            <span className="font-medium text-stone-800">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
