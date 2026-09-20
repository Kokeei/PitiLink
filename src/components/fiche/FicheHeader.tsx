import Link from "next/link";
import { calculerAge, formatDate } from "@/lib/format";
import { STATUTS_ENFANT_PILL } from "@/lib/badges";

const LIBELLES_STATUT: Record<string, string> = {
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
  SORTI: "Sorti",
  ARCHIVE: "Archivé",
};

const ICONE_SEXE: Record<string, string> = { GARCON: "♂", FILLE: "♀" };

/**
 * En-tête compact de la fiche enfant : seulement ce qu'une tatie doit voir
 * en un coup d'œil (identité, groupe, statut, alerte allergie) — le reste
 * (parents, historique, dernière compétence...) est dans les onglets.
 */
export function FicheHeader({
  enfant,
  groupeNom,
  allergies,
  retourHref,
  plusActions,
}: {
  enfant: { prenom: string; nom: string; dateNaissance: Date; sexe: string | null; photoUrl: string | null; statut: string };
  groupeNom?: string | null;
  allergies: string[];
  retourHref: string;
  plusActions?: React.ReactNode;
}) {
  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-100 text-3xl">
            {enfant.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={enfant.photoUrl} alt={enfant.prenom} className="h-full w-full object-cover" />
            ) : (
              "👶"
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold">
              {enfant.prenom} {enfant.nom}
            </h1>
            <p className="text-sm text-stone-500">
              Né(e) le {formatDate(enfant.dateNaissance)} · {calculerAge(enfant.dateNaissance)}
              {enfant.sexe && <span className="ml-1">{ICONE_SEXE[enfant.sexe]}</span>}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {groupeNom && <span className="pill bg-stone-100 text-xs text-stone-600">{groupeNom}</span>}
              <span className={`pill text-xs ${STATUTS_ENFANT_PILL[enfant.statut] ?? "bg-stone-100"}`}>
                {LIBELLES_STATUT[enfant.statut] ?? enfant.statut}
              </span>
              {allergies.length > 0 && (
                <span className="pill bg-red-100 text-xs text-red-700">⚠️ Allergie{allergies.length > 1 ? "s" : ""} : {allergies.join(", ")}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="#onglet-general" className="btn-secondary text-sm">
            ✏️ Modifier
          </Link>
          <Link href={retourHref} className="btn-secondary text-sm">
            ← Retour à la liste
          </Link>
          {plusActions && (
            <details className="relative">
              <summary className="btn-secondary cursor-pointer select-none text-sm">⋯ Plus d&apos;actions</summary>
              <div className="absolute right-0 z-10 mt-1 w-56 space-y-1 rounded-xl border border-stone-200 bg-white p-2 shadow-md">
                {plusActions}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
