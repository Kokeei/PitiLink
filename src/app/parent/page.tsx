import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, ROLES_PARENT } from "@/lib/session";
import { getEnfantsDuParent, getStatutJournalDuJour } from "@/lib/data";
import { calculerAge } from "@/lib/format";
import { ICONES_EVENEMENT } from "@/lib/journal";

export default async function MesEnfantsPage() {
  const user = await requireUser(ROLES_PARENT);
  const enfants = await getEnfantsDuParent(user.id);

  if (enfants.length === 1) {
    redirect(`/parent/enfants/${enfants[0].id}`);
  }

  const lignes = await Promise.all(
    enfants.map(async (enfant) => ({ enfant, statuts: await getStatutJournalDuJour(enfant.id) }))
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mes enfants</h1>
      {lignes.map(({ enfant, statuts }) => (
        <Link key={enfant.id} href={`/parent/enfants/${enfant.id}`} className="card block">
          <p className="text-lg font-semibold">
            👶 {enfant.prenom} — {calculerAge(enfant.dateNaissance)}
          </p>
          <p className="text-sm text-stone-500">{enfant.groupe?.nom}</p>
          <div className="mt-2 flex gap-2">
            {statuts.map((s) => (
              <span key={s.type} className={s.fait ? "text-lg" : "text-lg opacity-30"}>
                {ICONES_EVENEMENT[s.type]}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}
