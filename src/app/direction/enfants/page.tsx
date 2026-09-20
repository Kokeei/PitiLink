import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { calculerAge, formatDate } from "@/lib/format";
import { DonutChart } from "@/components/DonutChart";
import { creerEnfant } from "./actions";
import { STATUTS_ENFANT_PILL } from "@/lib/badges";
import type { StatutEnfant } from "@/generated/prisma/enums";

function prochainAnniversaire(dateNaissance: Date): Date {
  const aujourdhui = new Date();
  const prochain = new Date(aujourdhui.getFullYear(), dateNaissance.getMonth(), dateNaissance.getDate());
  if (prochain < new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate())) {
    prochain.setFullYear(prochain.getFullYear() + 1);
  }
  return prochain;
}

export default async function EnfantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; groupeId?: string; statut?: string }>;
}) {
  const user = await requireUser(ROLES_DIRECTION);
  const { q, groupeId, statut } = await searchParams;
  const garderieId = user.garderieId!;

  const [enfants, groupes, tousLesEnfantsActifs] = await Promise.all([
    prisma.enfant.findMany({
      where: {
        garderieId,
        ...(q
          ? {
              OR: [
                { prenom: { contains: q, mode: "insensitive" } },
                { nom: { contains: q, mode: "insensitive" } },
                { parents: { some: { user: { prenom: { contains: q, mode: "insensitive" } } } } },
                { parents: { some: { user: { nom: { contains: q, mode: "insensitive" } } } } },
              ],
            }
          : {}),
        ...(groupeId ? { groupeId } : {}),
        ...(statut ? { statut: statut as StatutEnfant } : {}),
      },
      include: { groupe: true, infosImportantes: true },
      orderBy: { prenom: "asc" },
    }),
    prisma.groupe.findMany({ where: { garderieId }, include: { _count: { select: { enfants: true } } } }),
    prisma.enfant.findMany({ where: { garderieId, statut: "ACTIF" }, select: { id: true, prenom: true, nom: true, dateNaissance: true, photoUrl: true } }),
  ]);

  const infosCritiques = enfants.flatMap((e) => e.infosImportantes.filter((i) => i.critique).map((i) => ({ ...i, enfant: e })));

  const anniversaires = tousLesEnfantsActifs
    .map((e) => ({ ...e, prochain: prochainAnniversaire(e.dateNaissance) }))
    .sort((a, b) => a.prochain.getTime() - b.prochain.getTime())
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Enfants</h1>
          <p className="text-sm text-stone-500">Liste de tous les enfants accueillis à la garderie.</p>
        </div>
      </div>

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

      <form className="card flex flex-wrap gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="🔍 Rechercher un enfant..." className="input-large flex-1 min-w-[180px]" />
        <select name="groupeId" defaultValue={groupeId ?? ""} className="input-large w-auto">
          <option value="">Tous les groupes</option>
          {groupes.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nom}
            </option>
          ))}
        </select>
        <select name="statut" defaultValue={statut ?? ""} className="input-large w-auto">
          <option value="">Tous les statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="SUSPENDU">Suspendu</option>
          <option value="SORTI">Sorti</option>
          <option value="ARCHIVE">Archivé</option>
        </select>
        <button className="btn-secondary">Filtrer</button>
        {(q || groupeId || statut) && (
          <Link href="/direction/enfants" className="btn-secondary">
            Réinitialiser
          </Link>
        )}
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-stone-500">
              <th className="pb-2">Nom</th>
              <th className="pb-2">Prénom</th>
              <th className="pb-2">Groupe</th>
              <th className="pb-2">Âge</th>
              <th className="pb-2">Statut</th>
              <th className="pb-2">Allergies / Particularités</th>
            </tr>
          </thead>
          <tbody>
            {enfants.map((e) => {
              const critique = e.infosImportantes.find((i) => i.critique);
              return (
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
                    <span className={`pill ${STATUTS_ENFANT_PILL[e.statut] ?? "bg-stone-100"}`}>{e.statut}</span>
                  </td>
                  <td>
                    {critique ? (
                      <span className="pill bg-red-100 text-xs text-red-700">⚠️ {critique.titre}</span>
                    ) : (
                      <span className="text-stone-400">Aucune</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {enfants.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-stone-500">
                  Aucun enfant ne correspond à ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <p className="mb-3 font-semibold">Répartition par groupe</p>
          <DonutChart
            centreValeur={tousLesEnfantsActifs.length}
            centreLabel="enfants"
            segments={groupes.map((g) => ({ label: g.nom, value: g._count.enfants }))}
          />
        </div>

        <div className="card space-y-2">
          <p className="font-semibold">🎂 Anniversaires à venir</p>
          {anniversaires.length === 0 && <p className="text-sm text-stone-500">Aucun enfant actif.</p>}
          <ul className="space-y-2 text-sm">
            {anniversaires.map((e) => (
              <li key={e.id} className="flex items-center justify-between">
                <span>
                  {e.prenom} {e.nom}
                </span>
                <span className="pill bg-stone-100 text-xs">{formatDate(e.prochain)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-2">
          <p className="font-semibold">❤️ Informations importantes</p>
          {infosCritiques.length === 0 && <p className="text-sm text-stone-500">Aucune information critique.</p>}
          <ul className="space-y-2 text-sm">
            {infosCritiques.slice(0, 5).map((i) => (
              <li key={i.id}>
                <Link href={`/direction/enfants/${i.enfant.id}`} className="text-orange-700 hover:underline">
                  {i.enfant.prenom}
                </Link>{" "}
                — {i.titre}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
