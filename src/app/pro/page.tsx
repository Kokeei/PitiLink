import Link from "next/link";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { getEnfantsPourProfessionnel, getStatutJournalDuJour, getPresenceDuJour } from "@/lib/data";
import { calculerAge, formatHeure } from "@/lib/format";
import { ICONES_EVENEMENT, LIBELLES_EVENEMENT } from "@/lib/journal";
import { etatPointage } from "@/lib/pointage";
import { marquerPresence } from "./enfants/[id]/actions";
import { BoutonEnvoi } from "@/components/pointage/BoutonEnvoi";

// Hauteur commune des boutons de pointage : le bouton « Départ » porte un sous-libellé
// (heure d'arrivée) et serait sinon plus haut que « Arrivée » ; la liste reste alignée.
const HAUTEUR_BOUTON = "min-h-20";

export default async function VueAujourdhuiPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser(ROLES_PRO);
  const { q } = await searchParams;
  const tousLesEnfants = await getEnfantsPourProfessionnel(user.id, user.garderieId!);
  const enfants = q
    ? tousLesEnfants.filter((e) => `${e.prenom} ${e.nom}`.toLowerCase().includes(q.toLowerCase()))
    : tousLesEnfants;

  const enfantsAvecStatut = await Promise.all(
    enfants.map(async (enfant) => ({
      enfant,
      statuts: await getStatutJournalDuJour(enfant.id),
      presence: await getPresenceDuJour(enfant.id),
    }))
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Mes enfants aujourd&apos;hui</h1>
        <p className="text-sm text-stone-500">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {enfantsAvecStatut.length === 0 && (
        <p className="card text-stone-500">Aucun enfant affecté pour le moment.</p>
      )}

      <div className="space-y-3">
        {enfantsAvecStatut.map(({ enfant, statuts, presence }) => (
          // La carte entière ouvre la fiche (lien étiré) ; le bouton de pointage reste cliquable au-dessus.
          <div key={enfant.id} className="card relative">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/pro/enfants/${enfant.id}`}
                className="min-w-0 flex-1 after:absolute after:inset-0 after:rounded-2xl after:content-['']"
              >
                <p className="text-lg font-semibold">
                  👶 {enfant.prenom} — {calculerAge(enfant.dateNaissance)}
                </p>
                <p className="text-sm text-stone-500">{enfant.groupe?.nom ?? "Sans groupe"}</p>
              </Link>
              <BoutonPointage enfantId={enfant.id} prenom={enfant.prenom} presence={presence} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {statuts.map(({ type, fait }) => (
                <span
                  key={type}
                  title={LIBELLES_EVENEMENT[type]}
                  className={`pill ${fait ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-400"}`}
                >
                  {ICONES_EVENEMENT[type]} {fait ? "✓" : "⬜"}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoutonPointage({
  enfantId,
  prenom,
  presence,
}: {
  enfantId: string;
  prenom: string;
  presence: Awaited<ReturnType<typeof getPresenceDuJour>>;
}) {
  const etat = etatPointage(presence);

  if (etat.etape === "absent") {
    // Absence déclarée mais l'enfant arrive quand même : pointage possible sans ouvrir la fiche.
    return (
      <div className="relative z-10 flex shrink-0 flex-col items-end gap-1">
        <span className="pill bg-stone-100 text-stone-500">Absent</span>
        <form action={marquerPresence.bind(null, enfantId, "arrivee")}>
          <BoutonEnvoi
            className="min-h-11 px-2 text-sm font-medium text-orange-700 underline underline-offset-2 disabled:opacity-40"
            ariaLabel={`${prenom} est là finalement : pointer son arrivée`}
          >
            Il est là finalement
          </BoutonEnvoi>
        </form>
      </div>
    );
  }

  if (etat.etape === "parti") {
    return (
      <span className="pill relative z-10 shrink-0 bg-green-100 text-green-700">
        👋 Parti · {formatHeure(etat.heureDepart)}
      </span>
    );
  }

  if (etat.etape === "arrivee") {
    return (
      <form action={marquerPresence.bind(null, enfantId, "arrivee")} className="relative z-10 shrink-0">
        <BoutonEnvoi className={`btn-primary min-w-[132px] ${HAUTEUR_BOUTON}`} ariaLabel={`Pointer l'arrivée de ${prenom}`}>
          🏠 Arrivée
        </BoutonEnvoi>
      </form>
    );
  }

  return (
    <form action={marquerPresence.bind(null, enfantId, "depart")} className="relative z-10 shrink-0">
      <BoutonEnvoi
        className={`btn-secondary min-w-[132px] ${HAUTEUR_BOUTON} flex-col gap-0`}
        ariaLabel={`Pointer le départ de ${prenom}`}
      >
        <span>👋 Départ</span>
        <span className="text-sm font-normal text-stone-600">arrivé·e {formatHeure(etat.heureArrivee)}</span>
      </BoutonEnvoi>
    </form>
  );
}
