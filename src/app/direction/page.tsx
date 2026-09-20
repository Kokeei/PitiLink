import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { debutJournee, finJournee, formatDate } from "@/lib/format";

export default async function TableauDeBordPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const garderieId = user.garderieId!;

  const [totalEnfants, presences, absencesEnAttente, incidentsDuJour, groupes, professionnels] =
    await Promise.all([
      prisma.enfant.count({ where: { garderieId, statut: "ACTIF" } }),
      prisma.presence.findMany({ where: { enfant: { garderieId }, date: debutJournee() } }),
      prisma.absence.findMany({
        where: { enfant: { garderieId }, statut: "DECLAREE" },
        include: { enfant: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.journalEvenement.findMany({
        where: {
          garderieId,
          type: "INCIDENT",
          timestamp: { gte: debutJournee(), lte: finJournee() },
        },
        include: { enfant: true },
      }),
      prisma.groupe.count({ where: { garderieId } }),
      prisma.user.count({ where: { garderieId, role: "PROFESSIONNEL" } }),
    ]);

  const presents = presences.filter((p) => p.statut === "PRESENT").length;
  const absents = presences.filter((p) => p.statut === "ABSENT").length;
  const aConfirmer = totalEnfants - presences.length;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Tableau de bord</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-tile bg-sky-50">
          <p className="text-2xl font-bold text-sky-700">{totalEnfants}</p>
          <p className="text-sm text-stone-500">enfants prévus</p>
        </div>
        <div className="stat-tile bg-emerald-50">
          <p className="text-2xl font-bold text-emerald-700">{presents}</p>
          <p className="text-sm text-stone-500">présents</p>
        </div>
        <div className="stat-tile bg-stone-100">
          <p className="text-2xl font-bold text-stone-600">{absents}</p>
          <p className="text-sm text-stone-500">absents</p>
        </div>
        <div className="stat-tile bg-orange-50">
          <p className="text-2xl font-bold text-orange-700">{Math.max(aConfirmer, 0)}</p>
          <p className="text-sm text-stone-500">à confirmer</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/direction/groupes" className="stat-tile bg-violet-50">
          <p className="text-2xl font-bold text-violet-700">{groupes}</p>
          <p className="text-sm text-stone-500">groupes</p>
        </Link>
        <Link href="/direction/professionnels" className="stat-tile bg-pink-50">
          <p className="text-2xl font-bold text-pink-700">{professionnels}</p>
          <p className="text-sm text-stone-500">professionnels</p>
        </Link>
      </div>

      <div className="card">
        <p className="mb-2 font-semibold">⚠️ À traiter</p>
        {absencesEnAttente.length === 0 && incidentsDuJour.length === 0 && (
          <p className="text-sm text-stone-500">Rien à signaler pour le moment.</p>
        )}
        <ul className="space-y-2 text-sm">
          {absencesEnAttente.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
              <span>
                🏖️ Absence {a.enfant.prenom} à confirmer ({formatDate(a.dateDebut)} → {formatDate(a.dateFin)})
              </span>
            </li>
          ))}
          {incidentsDuJour.map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
              <span>⚠️ Incident signalé — {i.enfant.prenom}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
