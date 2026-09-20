import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { creerGroupe, supprimerGroupe } from "./actions";

export default async function GroupesPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const groupes = await prisma.groupe.findMany({
    where: { garderieId: user.garderieId! },
    include: { _count: { select: { enfants: true } } },
    orderBy: { nom: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Groupes</h1>

      <div className="card space-y-3">
        <p className="font-semibold">Créer un groupe</p>
        <form action={creerGroupe} className="grid grid-cols-2 gap-2">
          <input name="nom" placeholder="Nom du groupe" className="input-large" required />
          <input name="capacite" type="number" placeholder="Capacité" className="input-large" />
          <button className="btn-primary col-span-2">Créer</button>
        </form>
      </div>

      <div className="space-y-2">
        {groupes.map((g) => (
          <div key={g.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{g.nom}</p>
              <p className="text-sm text-stone-500">
                {g._count.enfants} enfant(s) {g.capacite ? `· capacité ${g.capacite}` : ""}
              </p>
            </div>
            <form action={supprimerGroupe.bind(null, g.id)}>
              <button className="text-sm text-red-600">Supprimer</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
