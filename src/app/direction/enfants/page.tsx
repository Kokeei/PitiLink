import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { calculerAge } from "@/lib/format";
import { creerEnfant } from "./actions";

export default async function EnfantsPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const [enfants, groupes] = await Promise.all([
    prisma.enfant.findMany({
      where: { garderieId: user.garderieId! },
      include: { groupe: true },
      orderBy: { prenom: "asc" },
    }),
    prisma.groupe.findMany({ where: { garderieId: user.garderieId! } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Enfants</h1>

      <div className="card space-y-3">
        <p className="font-semibold">Ajouter un enfant</p>
        <form action={creerEnfant} className="grid grid-cols-2 gap-2">
          <input name="prenom" placeholder="Prénom" className="input-large" required />
          <input name="nom" placeholder="Nom" className="input-large" required />
          <input name="dateNaissance" type="date" className="input-large" required />
          <select name="groupeId" className="input-large">
            <option value="">Sans groupe</option>
            {groupes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom}
              </option>
            ))}
          </select>
          <button className="btn-primary col-span-2">Créer la fiche</button>
        </form>
      </div>

      <div className="space-y-2">
        {enfants.map((e) => (
          <Link key={e.id} href={`/direction/enfants/${e.id}`} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{e.prenom} {e.nom}</p>
              <p className="text-sm text-stone-500">
                {calculerAge(e.dateNaissance)} · {e.groupe?.nom ?? "Sans groupe"}
              </p>
            </div>
            <span className="pill bg-stone-100">{e.statut}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
