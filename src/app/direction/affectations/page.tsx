import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { DonutChart } from "@/components/DonutChart";
import { ProgressBar } from "@/components/ProgressBar";
import { creerAffectation, supprimerAffectation, reaffecter } from "./actions";

export default async function AffectationsPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const garderieId = user.garderieId!;

  const [enfants, professionnels, affectations, groupes] = await Promise.all([
    prisma.enfant.findMany({ where: { garderieId, statut: "ACTIF" }, orderBy: { prenom: "asc" } }),
    prisma.user.findMany({ where: { garderieId, role: "PROFESSIONNEL" }, orderBy: { prenom: "asc" } }),
    prisma.affectation.findMany({
      where: { enfant: { garderieId }, actif: true },
      include: { enfant: true, professionnel: true, groupe: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.groupe.findMany({ where: { garderieId }, orderBy: { nom: "asc" } }),
  ]);

  const enfantsAffectesIds = new Set(affectations.map((a) => a.enfantId));
  const professionnelsActifsIds = new Set(affectations.map((a) => a.professionnelId));
  const enfantsNonAffectes = enfants.filter((e) => !enfantsAffectesIds.has(e.id));

  const chargeParPro = professionnels
    .map((p) => ({ pro: p, nb: affectations.filter((a) => a.professionnelId === p.id).length }))
    .filter((c) => c.nb > 0)
    .sort((a, b) => b.nb - a.nb);
  const chargeMax = Math.max(1, ...chargeParPro.map((c) => c.nb));

  const segmentsGroupes = groupes.map((g) => ({
    label: g.nom,
    value: affectations.filter((a) => a.groupeId === g.id).length,
  }));
  const sansGroupe = affectations.filter((a) => !a.groupeId).length;
  if (sansGroupe > 0) segmentsGroupes.push({ label: "Sans groupe", value: sansGroupe });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Affectations</h1>
        <p className="text-sm text-stone-500">Attribution des enfants aux professionnels référents.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-tile bg-orange-50">
          <p className="text-2xl font-bold text-orange-700">{enfantsAffectesIds.size}</p>
          <p className="text-xs text-stone-500">Enfants affectés</p>
        </div>
        <div className="stat-tile bg-blue-50">
          <p className="text-2xl font-bold text-blue-700">{professionnelsActifsIds.size}</p>
          <p className="text-xs text-stone-500">Professionnels mobilisés</p>
        </div>
        <div className="stat-tile bg-violet-50">
          <p className="text-2xl font-bold text-violet-700">{groupes.length}</p>
          <p className="text-xs text-stone-500">Groupes</p>
        </div>
        <div className="stat-tile bg-amber-50">
          <p className="text-2xl font-bold text-amber-700">{enfantsNonAffectes.length}</p>
          <p className="text-xs text-stone-500">Enfants non affectés</p>
        </div>
      </div>

      <div className="card space-y-3">
        <p className="font-semibold">Nouvelle affectation</p>
        <form action={creerAffectation} className="grid grid-cols-2 gap-2">
          <select name="enfantId" className="input-large" required>
            <option value="">Enfant...</option>
            {enfants.map((e) => (
              <option key={e.id} value={e.id}>
                {e.prenom} {e.nom}
              </option>
            ))}
          </select>
          <select name="professionnelId" className="input-large" required>
            <option value="">Professionnel...</option>
            {professionnels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.prenom} {p.nom}
              </option>
            ))}
          </select>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="referente" className="h-5 w-5" /> Tatie référente
          </label>
          <button className="btn-primary col-span-2">Affecter</button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card overflow-x-auto lg:col-span-2">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-stone-500">
                <th className="pb-2">Enfant</th>
                <th className="pb-2">Professionnel</th>
                <th className="pb-2">Référente</th>
                <th className="pb-2">Depuis le</th>
                <th className="pb-2">Jusqu&apos;au</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {affectations.map((a) => (
                <tr key={a.id} className="border-t border-stone-100 align-top">
                  <td className="py-2 font-medium">
                    {a.enfant.prenom} {a.enfant.nom}
                  </td>
                  <td>
                    <p className="mb-1">
                      {a.professionnel.prenom} {a.professionnel.nom}
                    </p>
                    <form action={reaffecter.bind(null, a.id)} className="flex items-center gap-1">
                      <select
                        name="professionnelId"
                        className="min-h-0 rounded-lg border border-stone-200 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Réaffecter à...
                        </option>
                        {professionnels
                          .filter((p) => p.id !== a.professionnelId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.prenom} {p.nom}
                            </option>
                          ))}
                      </select>
                      <button className="rounded-lg border border-stone-200 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50">
                        OK
                      </button>
                    </form>
                  </td>
                  <td>{a.referente ? <span className="pill bg-amber-100 text-xs text-amber-700">⭐ Référente</span> : <span className="text-stone-400">-</span>}</td>
                  <td>{formatDate(a.createdAt)}</td>
                  <td className="text-stone-400">-</td>
                  <td>
                    <form action={supprimerAffectation.bind(null, a.id)}>
                      <button className="text-xs text-red-600">Retirer</button>
                    </form>
                  </td>
                </tr>
              ))}
              {affectations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-stone-500">
                    Aucune affectation pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="card">
            <p className="mb-3 font-semibold">Répartition par groupe</p>
            <DonutChart centreValeur={affectations.length} centreLabel="affectations" segments={segmentsGroupes} />
          </div>

          <div className="card space-y-3">
            <p className="font-semibold">Charge par professionnel</p>
            {chargeParPro.length === 0 && <p className="text-sm text-stone-500">Aucune affectation active.</p>}
            {chargeParPro.map((c) => (
              <ProgressBar key={c.pro.id} value={c.nb} max={chargeMax} label={`${c.pro.prenom} ${c.pro.nom} · ${c.nb} enfant${c.nb > 1 ? "s" : ""}`} />
            ))}
          </div>
        </div>
      </div>

      {enfantsNonAffectes.length > 0 && (
        <div className="card space-y-2">
          <p className="font-semibold">Enfants sans professionnel affecté</p>
          <div className="flex flex-wrap gap-2">
            {enfantsNonAffectes.map((e) => (
              <span key={e.id} className="pill bg-stone-100 text-sm">
                {e.prenom} {e.nom}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
