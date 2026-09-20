import Link from "next/link";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { getEnfantsPourProfessionnel, getStatutJournalDuJour, getPresenceDuJour } from "@/lib/data";
import { calculerAge } from "@/lib/format";
import { ICONES_EVENEMENT, LIBELLES_EVENEMENT } from "@/lib/journal";

export default async function VueAujourdhuiPage() {
  const user = await requireUser(ROLES_PRO);
  const enfants = await getEnfantsPourProfessionnel(user.id, user.garderieId!);

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
          <Link key={enfant.id} href={`/pro/enfants/${enfant.id}`} className="card block">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  👶 {enfant.prenom} — {calculerAge(enfant.dateNaissance)}
                </p>
                <p className="text-sm text-stone-500">{enfant.groupe?.nom ?? "Sans groupe"}</p>
              </div>
              {presence?.statut === "PRESENT" && <span className="pill bg-green-100 text-green-700">Présent</span>}
              {presence?.statut === "ABSENT" && <span className="pill bg-stone-100 text-stone-500">Absent</span>}
              {(!presence || presence.statut === "PREVU") && (
                <span className="pill bg-orange-100 text-orange-700">Prévu</span>
              )}
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
          </Link>
        ))}
      </div>
    </div>
  );
}
