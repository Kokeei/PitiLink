import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { calculerImpactFacturation, LIBELLES_TYPE_ABSENCE } from "@/lib/absences";
import { modifierReglesAbsence, annulerAbsence } from "./actions";

const IMPACT_PILL: Record<string, string> = {
  DECOMPTEE: "bg-emerald-100 text-emerald-700",
  FACTUREE: "bg-red-100 text-red-700",
};
const IMPACT_LABEL: Record<string, string> = {
  DECOMPTEE: "🟢 Décomptée",
  FACTUREE: "🔴 Facturée",
};

export default async function AbsencesDirectionPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const garderieId = user.garderieId!;

  const [garderie, absences] = await Promise.all([
    prisma.garderie.findUniqueOrThrow({ where: { id: garderieId } }),
    prisma.absence.findMany({
      where: { enfant: { garderieId } },
      include: { enfant: true },
      orderBy: { dateDebut: "desc" },
      take: 100,
    }),
  ]);

  const actives = absences.filter((a) => a.statut !== "ANNULEE");
  const nbDecomptees = actives.filter((a) => calculerImpactFacturation(a, garderie).impact === "DECOMPTEE").length;
  const nbFacturees = actives.length - nbDecomptees;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Absences</h1>
        <p className="text-sm text-stone-500">
          Déclarées par les familles. L&apos;incidence financière est calculée automatiquement selon les règles
          ci-dessous — il n&apos;y a rien à valider.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="stat-tile bg-stone-100">
          <p className="text-2xl font-bold text-stone-700">{actives.length}</p>
          <p className="text-xs text-stone-500">Absences actives</p>
        </div>
        <div className="stat-tile bg-emerald-50">
          <p className="text-2xl font-bold text-emerald-700">{nbDecomptees}</p>
          <p className="text-xs text-stone-500">Décomptées</p>
        </div>
        <div className="stat-tile bg-red-50">
          <p className="text-2xl font-bold text-red-700">{nbFacturees}</p>
          <p className="text-xs text-stone-500">Facturées</p>
        </div>
      </div>

      <details className="card">
        <summary className="cursor-pointer select-none font-semibold">⚙️ Règles de facturation des absences</summary>
        <form action={modifierReglesAbsence} className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-stone-600">
              Préavis minimum (en jours) pour qu&apos;une absence soit décomptée
            </label>
            <input
              name="absenceDelaiPreavisJours"
              type="number"
              min={0}
              defaultValue={garderie.absenceDelaiPreavisJours}
              className="input-large w-32"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="absenceMaladieCertificatDecompte"
              defaultChecked={garderie.absenceMaladieCertificatDecompte}
              className="h-5 w-5"
            />
            Maladie avec certificat médical → toujours décomptée, quel que soit le préavis
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="absenceMaladieSansCertificatDecompte"
              defaultChecked={garderie.absenceMaladieSansCertificatDecompte}
              className="h-5 w-5"
            />
            Maladie sans certificat médical → décomptée quand même
          </label>
          <button className="btn-secondary">Enregistrer les règles</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-stone-500">
              <th className="pb-2">Enfant</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Dates</th>
              <th className="pb-2">Justificatif</th>
              <th className="pb-2">Incidence</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {absences.map((a) => {
              const annulee = a.statut === "ANNULEE";
              const { impact, motif } = calculerImpactFacturation(a, garderie);
              return (
                <tr key={a.id} className={`border-t border-stone-100 ${annulee ? "opacity-50" : ""}`}>
                  <td className="py-2 font-medium">{a.enfant.prenom} {a.enfant.nom}</td>
                  <td>{LIBELLES_TYPE_ABSENCE[a.type]}</td>
                  <td>{formatDate(a.dateDebut)} → {formatDate(a.dateFin)}</td>
                  <td>
                    {a.justificatifUrl ? (
                      <a href={a.justificatifUrl} target="_blank" rel="noreferrer" className="text-orange-700 hover:underline">
                        📄 Voir
                      </a>
                    ) : (
                      <span className="text-stone-400">Aucun</span>
                    )}
                  </td>
                  <td>
                    {annulee ? (
                      <span className="pill bg-stone-100 text-stone-500">Annulée</span>
                    ) : (
                      <span className={`pill ${IMPACT_PILL[impact]}`} title={motif}>
                        {IMPACT_LABEL[impact]}
                      </span>
                    )}
                  </td>
                  <td>
                    {!annulee && (
                      <form action={annulerAbsence.bind(null, a.id)}>
                        <button className="text-xs text-red-600">Annuler</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {absences.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-stone-500">
                  Aucune absence déclarée pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
