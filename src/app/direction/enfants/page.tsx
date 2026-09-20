import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { TableauEnfants, type LigneEnfant } from "@/components/enfants/TableauEnfants";

export default async function EnfantsPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const garderieId = user.garderieId!;

  const [enfants, groupes] = await Promise.all([
    prisma.enfant.findMany({
      where: { garderieId },
      include: { groupe: true, allergies: { include: { allergene: true } } },
      orderBy: { prenom: "asc" },
    }),
    prisma.groupe.findMany({ where: { garderieId }, orderBy: { nom: "asc" } }),
  ]);

  const lignes: LigneEnfant[] = enfants.map((e) => ({
    id: e.id,
    prenom: e.prenom,
    nom: e.nom,
    photoUrl: e.photoUrl,
    dateNaissance: e.dateNaissance.toISOString(),
    groupeNom: e.groupe?.nom ?? null,
    statut: e.statut,
    allergies: e.allergies.map((a) => a.allergene.nom),
  }));

  const actifs = enfants.filter((e) => e.statut === "ACTIF");
  const parGroupe = groupes.map((g) => ({ nom: g.nom, total: actifs.filter((e) => e.groupeId === g.id).length }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Enfants</h1>
          <p className="text-sm text-stone-500">Liste des enfants accueillis à la garderie.</p>
        </div>
        <Link href="/direction/enfants/nouveau" className="btn-primary">
          + Ajouter un enfant
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card">
          <p className="text-2xl font-bold">{actifs.length}</p>
          <p className="text-sm text-stone-500">Enfants accueillis</p>
        </div>
        {parGroupe.slice(0, 3).map((g) => (
          <div key={g.nom} className="card">
            <p className="text-2xl font-bold">{g.total}</p>
            <p className="text-sm text-stone-500">{g.nom}</p>
          </div>
        ))}
      </div>

      <TableauEnfants enfants={lignes} groupes={groupes} />
    </div>
  );
}
