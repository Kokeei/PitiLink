import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PARENT } from "@/lib/session";
import { getEnfantsDuParent } from "@/lib/data";
import { formatDate } from "@/lib/format";
import {
  calculerImpactFacturation,
  LIBELLES_TYPE_ABSENCE,
  IMPACT_FACTURATION_PILL,
  IMPACT_FACTURATION_LABEL,
} from "@/lib/absences";
import { declarerAbsence } from "./actions";

export default async function AbsencesPage() {
  const user = await requireUser(ROLES_PARENT);
  const enfants = await getEnfantsDuParent(user.id);

  if (enfants.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Absences</h1>
        <p className="card text-sm text-stone-500">Aucun enfant n&apos;est encore rattaché à votre compte.</p>
      </div>
    );
  }

  const [absences, garderie] = await Promise.all([
    prisma.absence.findMany({
      where: { enfantId: { in: enfants.map((e) => e.id) } },
      include: { enfant: true },
      orderBy: { dateDebut: "desc" },
    }),
    prisma.garderie.findUniqueOrThrow({ where: { id: enfants[0].garderieId } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Absences</h1>

      <div className="card space-y-3">
        <p className="font-semibold">Déclarer une absence</p>
        <form action={declarerAbsence} className="space-y-3">
          <select name="enfantId" className="input-large" required>
            {enfants.map((e) => (
              <option key={e.id} value={e.id}>
                {e.prenom}
              </option>
            ))}
          </select>
          <select name="type" className="input-large" required>
            {Object.entries(LIBELLES_TYPE_ABSENCE).map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>
                {libelle}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input name="dateDebut" type="date" className="input-large" required />
            <input name="dateFin" type="date" className="input-large" required />
          </div>
          <textarea name="commentaire" placeholder="Précision (optionnel)" className="input-large" rows={2} />
          <div>
            <label className="mb-1 block text-sm text-stone-600">
              Certificat médical (si maladie — évite la facturation du/des jour(s) concerné(s))
            </label>
            <input type="file" name="justificatif" accept="image/*,.pdf" className="text-sm" />
          </div>
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
            ℹ️ L&apos;incidence financière (jour décompté ou facturé) dépend des règles définies par votre
            garderie — préavis minimum de {garderie.absenceDelaiPreavisJours} jour
            {garderie.absenceDelaiPreavisJours > 1 ? "s" : ""}, sauf maladie avec certificat.
          </p>
          <button className="btn-primary w-full">Déclarer l&apos;absence</button>
        </form>
      </div>

      <div className="space-y-2">
        {absences.map((a) => {
          const annulee = a.statut === "ANNULEE";
          const { impact, motif } = calculerImpactFacturation(a, garderie);
          return (
            <div key={a.id} className={`card flex items-center justify-between ${annulee ? "opacity-60" : ""}`}>
              <div>
                <p className="font-medium">
                  {a.enfant.prenom} — {LIBELLES_TYPE_ABSENCE[a.type]}
                </p>
                <p className="text-sm text-stone-500">
                  {formatDate(a.dateDebut)} → {formatDate(a.dateFin)}
                </p>
                <p className="text-xs text-stone-400">{annulee ? "Annulée par la garderie" : motif}</p>
              </div>
              {annulee ? (
                <span className="pill bg-stone-100 text-stone-500">Annulée</span>
              ) : (
                <span className={`pill ${IMPACT_FACTURATION_PILL[impact]}`}>{IMPACT_FACTURATION_LABEL[impact]}</span>
              )}
            </div>
          );
        })}
        {absences.length === 0 && <p className="text-sm text-stone-500">Aucune absence déclarée.</p>}
      </div>
    </div>
  );
}
