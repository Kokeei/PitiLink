import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PARENT } from "@/lib/session";
import { getEnfantsDuParent } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { declarerAbsence } from "./actions";

const TYPES_ABSENCE = [
  { valeur: "MALADIE", libelle: "🤒 Maladie", note: "Un certificat médical peut éviter la facturation selon les règles de la garderie." },
  { valeur: "VACANCES", libelle: "🏖️ Vacances", note: "Une déclaration dans les délais peut donner lieu à une déduction." },
  { valeur: "GARDE_DOMICILE", libelle: "🏠 Garde à domicile", note: "Selon les règles de la garderie, une facturation peut s'appliquer." },
  { valeur: "AUTRE", libelle: "Autre", note: "" },
];

const STATUTS: Record<string, string> = {
  DECLAREE: "🟠 Déclarée",
  CONFIRMEE: "🟢 Confirmée",
  REFUSEE: "🔴 Refusée",
};

export default async function AbsencesPage() {
  const user = await requireUser(ROLES_PARENT);
  const enfants = await getEnfantsDuParent(user.id);

  const absences = await prisma.absence.findMany({
    where: { enfantId: { in: enfants.map((e) => e.id) } },
    include: { enfant: true },
    orderBy: { dateDebut: "desc" },
  });

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
            {TYPES_ABSENCE.map((t) => (
              <option key={t.valeur} value={t.valeur}>
                {t.libelle}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input name="dateDebut" type="date" className="input-large" required />
            <input name="dateFin" type="date" className="input-large" required />
          </div>
          <textarea name="commentaire" placeholder="Précision (optionnel)" className="input-large" rows={2} />
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
            ℹ️ L&apos;incidence financière dépend des règles définies par votre garderie et vous sera
            communiquée après validation par la direction.
          </p>
          <button className="btn-primary w-full">Déclarer l&apos;absence</button>
        </form>
      </div>

      <div className="space-y-2">
        {absences.map((a) => (
          <div key={a.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">
                {a.enfant.prenom} — {TYPES_ABSENCE.find((t) => t.valeur === a.type)?.libelle}
              </p>
              <p className="text-sm text-stone-500">
                {formatDate(a.dateDebut)} → {formatDate(a.dateFin)}
              </p>
            </div>
            <span className="pill bg-stone-100">{STATUTS[a.statut]}</span>
          </div>
        ))}
        {absences.length === 0 && <p className="text-sm text-stone-500">Aucune absence déclarée.</p>}
      </div>
    </div>
  );
}
