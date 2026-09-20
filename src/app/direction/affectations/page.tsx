import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { creerAffectation, supprimerAffectation, reaffecter } from "./actions";

export default async function AffectationsPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const garderieId = user.garderieId!;

  const [enfants, professionnels, affectations] = await Promise.all([
    prisma.enfant.findMany({ where: { garderieId, statut: "ACTIF" }, orderBy: { prenom: "asc" } }),
    prisma.user.findMany({ where: { garderieId, role: "PROFESSIONNEL" }, orderBy: { prenom: "asc" } }),
    prisma.affectation.findMany({
      where: { enfant: { garderieId } },
      include: { enfant: true, professionnel: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Affectations</h1>

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

      <div className="space-y-2">
        {affectations.map((a) => (
          <div key={a.id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {a.enfant.prenom} → {a.professionnel.prenom} {a.professionnel.nom} {a.referente && "⭐"}
              </p>
              <form action={supprimerAffectation.bind(null, a.id)}>
                <button className="text-sm text-red-600">Retirer</button>
              </form>
            </div>
            <form action={reaffecter.bind(null, a.id)} className="flex gap-2">
              <select name="professionnelId" className="input-large flex-1 text-sm" defaultValue="">
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
              <button className="btn-secondary text-sm">Réaffecter</button>
            </form>
          </div>
        ))}
        {affectations.length === 0 && <p className="text-sm text-stone-500">Aucune affectation.</p>}
      </div>
    </div>
  );
}
