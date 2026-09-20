export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const couleur = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-orange-500" : "bg-emerald-500";

  return (
    <div className="space-y-1">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${couleur}`} style={{ width: `${pct}%` }} />
      </div>
      {label && <p className="text-xs text-stone-500">{label}</p>}
    </div>
  );
}
