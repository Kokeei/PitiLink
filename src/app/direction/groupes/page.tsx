import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { calculerAge } from "@/lib/format";
import { couleurParIndex } from "@/lib/palette";
import { ProgressBar } from "@/components/ProgressBar";
import { creerGroupe, supprimerGroupe } from "./actions";

export default async function GroupesPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const groupes = await prisma.groupe.findMany({
    where: { garderieId: user.garderieId! },
    include: {
      enfants: { where: { statut: "ACTIF" }, orderBy: { prenom: "asc" } },
      affectations: { where: { referente: true }, include: { professionnel: true } },
    },
    orderBy: { nom: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Groupes</h1>
          <p className="text-sm text-stone-500">Organisez les enfants par tranche d&apos;âge.</p>
        </div>
      </div>

      <div className="card space-y-3">
        <p className="font-semibold">Créer un groupe</p>
        <form action={creerGroupe} className="grid grid-cols-2 gap-2">
          <input name="nom" placeholder="Nom du groupe" className="input-large" required />
          <input name="capacite" type="number" placeholder="Capacité" className="input-large" />
          <button className="btn-primary col-span-2">Créer</button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groupes.map((g, i) => {
          const c = couleurParIndex(i);
          const referents = Array.from(new Map(g.affectations.map((a) => [a.professionnelId, a.professionnel])).values());
          const ageRange =
            g.ageMinMois != null || g.ageMaxMois != null ? `${g.ageMinMois ?? 0} – ${g.ageMaxMois ?? "?"} mois` : null;

          return (
            <div key={g.id} className="card space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${c.bg}`}>👶</span>
                  <div>
                    <p className="flex items-center gap-2 text-lg font-semibold">
                      {g.nom}
                      {ageRange && <span className="pill bg-stone-100 text-xs text-stone-600">{ageRange}</span>}
                    </p>
                    <p className="text-sm text-stone-500">
                      {g.enfants.length} enfant{g.enfants.length > 1 ? "s" : ""}
                      {g.capacite ? ` · Capacité : ${g.capacite}` : ""}
                    </p>
                  </div>
                </div>
                {g.enfants.length === 0 && (
                  <form action={supprimerGroupe.bind(null, g.id)}>
                    <button className="text-xs text-red-600">Supprimer</button>
                  </form>
                )}
              </div>

              {g.capacite && <ProgressBar value={g.enfants.length} max={g.capacite} label={`${Math.round((g.enfants.length / g.capacite) * 100)}% occupé`} />}

              <div>
                <p className="mb-2 text-sm font-semibold text-stone-600">Enfants dans ce groupe</p>
                {g.enfants.length === 0 ? (
                  <p className="text-sm text-stone-400">Aucun enfant dans ce groupe.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {g.enfants.map((e) => (
                      <Link key={e.id} href={`/direction/enfants/${e.id}`} className="flex w-16 flex-col items-center gap-1 text-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg">
                          {e.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={e.photoUrl} alt={e.prenom} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            "👶"
                          )}
                        </span>
                        <p className="truncate text-xs font-medium">{e.prenom}</p>
                        <p className="text-[10px] text-stone-400">{calculerAge(e.dateNaissance)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {referents.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-stone-600">Professionnels référents</p>
                  <div className="flex flex-wrap gap-2">
                    {referents.map((p) => (
                      <span key={p.id} className="pill bg-stone-100 text-sm">
                        ⭐ {p.prenom} {p.nom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {groupes.length === 0 && <p className="card text-stone-500">Aucun groupe pour le moment.</p>}
      </div>
    </div>
  );
}
