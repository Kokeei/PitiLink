import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { getEnfantsPourProfessionnel, getStatutJournalDuJour } from "@/lib/data";
import { calculerAge } from "@/lib/format";
import { ajouterActiviteGroupee } from "./actions";

export default async function VueGroupePage() {
  const user = await requireUser(ROLES_PRO);
  const enfants = await getEnfantsPourProfessionnel(user.id, user.garderieId!);
  const activites = await prisma.activite.findMany({ where: { garderieId: user.garderieId! } });

  const lignes = await Promise.all(
    enfants.map(async (enfant) => ({ enfant, statuts: await getStatutJournalDuJour(enfant.id) }))
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Vue groupe</h1>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-stone-500">
              <th className="pb-2">Enfant</th>
              <th className="pb-2">🍽️ Repas</th>
              <th className="pb-2">🧷 Couche</th>
              <th className="pb-2">😴 Sieste</th>
              <th className="pb-2">😊 Humeur</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map(({ enfant, statuts }) => {
              const s = Object.fromEntries(statuts.map((s) => [s.type, s.fait]));
              return (
                <tr key={enfant.id} className="border-t border-stone-100">
                  <td className="py-2">
                    <Link href={`/pro/enfants/${enfant.id}`} className="font-medium text-orange-700">
                      {enfant.prenom}
                    </Link>
                    <p className="text-xs text-stone-400">{calculerAge(enfant.dateNaissance)}</p>
                  </td>
                  <td>{s.REPAS ? "✓" : "⏳"}</td>
                  <td>{s.CHANGE ? "✓" : "⏳"}</td>
                  <td>{s.SIESTE ? "✓" : "⏳"}</td>
                  <td>{s.HUMEUR ? "✓" : "⏳"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card space-y-3">
        <p className="font-semibold">🎨 Action groupée — Activité</p>
        <form action={ajouterActiviteGroupee} className="space-y-3">
          <div className="space-y-1">
            {enfants.map((enfant) => (
              <label key={enfant.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="enfantIds" value={enfant.id} className="h-5 w-5" />
                {enfant.prenom}
              </label>
            ))}
          </div>
          <select name="nom" className="input-large" required>
            <option value="">Choisir une activité...</option>
            {activites.map((a) => (
              <option key={a.id} value={a.nom}>
                {a.nom}
              </option>
            ))}
          </select>
          <button className="btn-primary w-full">Enregistrer pour les enfants sélectionnés</button>
        </form>
      </div>
    </div>
  );
}
