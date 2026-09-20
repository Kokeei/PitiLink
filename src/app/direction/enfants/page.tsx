import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { calculerAge } from "@/lib/format";
import { creerEnfant } from "./actions";

export default async function EnfantsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser(ROLES_DIRECTION);
  const { q } = await searchParams;

  const [enfants, groupes] = await Promise.all([
    prisma.enfant.findMany({
      where: {
        garderieId: user.garderieId!,
        ...(q ? { OR: [{ prenom: { contains: q, mode: "insensitive" } }, { nom: { contains: q, mode: "insensitive" } }] } : {}),
      },
      include: { groupe: true },
      orderBy: { prenom: "asc" },
    }),
    prisma.groupe.findMany({ where: { garderieId: user.garderieId! } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Enfants</h1>
      {q && (
        <p className="text-sm text-stone-500">
          Résultats pour « {q} » — <Link href="/direction/enfants" className="text-orange-600">effacer</Link>
        </p>
      )}

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

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-stone-500">
              <th className="pb-2">Nom</th>
              <th className="pb-2">Prénom</th>
              <th className="pb-2">Groupe</th>
              <th className="pb-2">Âge</th>
              <th className="pb-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {enfants.map((e) => (
              <tr key={e.id} className="border-t border-stone-100">
                <td className="py-2">
                  <Link href={`/direction/enfants/${e.id}`} className="font-medium text-orange-700 hover:underline">
                    {e.nom}
                  </Link>
                </td>
                <td>
                  <Link href={`/direction/enfants/${e.id}`} className="hover:underline">
                    {e.prenom}
                  </Link>
                </td>
                <td>{e.groupe?.nom ?? "Sans groupe"}</td>
                <td>{calculerAge(e.dateNaissance)}</td>
                <td>
                  <span className="pill bg-stone-100">{e.statut}</span>
                </td>
              </tr>
            ))}
            {enfants.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-stone-500">
                  Aucun enfant pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
