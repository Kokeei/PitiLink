import { calculerAge, formatDate } from "@/lib/format";

const STATUTS_PILL: Record<string, string> = {
  ACTIF: "bg-green-100 text-green-700",
  SUSPENDU: "bg-amber-100 text-amber-700",
  SORTI: "bg-stone-200 text-stone-600",
  ARCHIVE: "bg-stone-200 text-stone-500",
};

export function EnTeteEnfant({
  enfant,
  referente,
  petitMot,
  actions,
}: {
  enfant: { prenom: string; nom: string; dateNaissance: Date; statut: string; photoUrl: string | null };
  referente?: string | null;
  groupe?: string | null;
  petitMot?: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-100 text-4xl">
        {enfant.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={enfant.photoUrl} alt={enfant.prenom} className="h-full w-full object-cover" />
        ) : (
          "👶"
        )}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">{enfant.prenom} {enfant.nom}</h1>
          <span className={`pill ${STATUTS_PILL[enfant.statut] ?? "bg-stone-100"}`}>{enfant.statut}</span>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          Né le {formatDate(enfant.dateNaissance)} ({calculerAge(enfant.dateNaissance)})
        </p>
        {referente && <p className="text-sm text-stone-500">Référente : {referente}</p>}
        {petitMot && <p className="mt-2 rounded-xl bg-green-50 px-3 py-2 text-sm italic text-green-800">💬 « {petitMot} »</p>}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
