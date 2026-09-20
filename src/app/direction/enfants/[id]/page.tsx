import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { calculerAge, formatDate } from "@/lib/format";
import { modifierStatutEnfant, ajouterInfoImportante, supprimerInfoImportante } from "../actions";

export default async function FicheEnfantDirectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(ROLES_DIRECTION);

  const [enfant, groupes] = await Promise.all([
    prisma.enfant.findFirst({
      where: { id, garderieId: user.garderieId! },
      include: {
        groupe: true,
        infosImportantes: true,
        parents: { include: { user: true } },
        affectations: { include: { professionnel: true } },
      },
    }),
    prisma.groupe.findMany({ where: { garderieId: user.garderieId! } }),
  ]);
  if (!enfant) notFound();

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-bold">{enfant.prenom} {enfant.nom}</h1>
        <p className="text-sm text-stone-500">
          🎂 {formatDate(enfant.dateNaissance)} · {calculerAge(enfant.dateNaissance)}
        </p>
      </div>

      <div className="card space-y-3">
        <p className="font-semibold">Statut & groupe</p>
        <form action={modifierStatutEnfant.bind(null, id)} className="grid grid-cols-2 gap-2">
          <select name="statut" defaultValue={enfant.statut} className="input-large">
            <option value="ACTIF">Actif</option>
            <option value="SUSPENDU">Suspendu</option>
            <option value="SORTI">Sorti</option>
            <option value="ARCHIVE">Archivé</option>
          </select>
          <select name="groupeId" defaultValue={enfant.groupeId ?? ""} className="input-large">
            <option value="">Sans groupe</option>
            {groupes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom}
              </option>
            ))}
          </select>
          <button className="btn-primary col-span-2">Enregistrer</button>
        </form>
      </div>

      <div className="card space-y-2">
        <p className="font-semibold">Famille</p>
        {enfant.parents.length === 0 && <p className="text-sm text-stone-500">Aucun parent lié.</p>}
        <ul className="text-sm">
          {enfant.parents.map((p) => (
            <li key={p.id}>
              {p.user.prenom} {p.user.nom} ({p.lien}) — {p.user.email}
            </li>
          ))}
        </ul>
      </div>

      <div className="card space-y-2">
        <p className="font-semibold">Affectations</p>
        {enfant.affectations.length === 0 && <p className="text-sm text-stone-500">Aucune affectation.</p>}
        <ul className="text-sm">
          {enfant.affectations.map((a) => (
            <li key={a.id}>
              {a.professionnel.prenom} {a.professionnel.nom} {a.referente && "⭐ référente"}
            </li>
          ))}
        </ul>
      </div>

      <div className="card space-y-3">
        <p className="font-semibold">⚠️ Informations importantes</p>
        <ul className="space-y-2 text-sm">
          {enfant.infosImportantes.map((info) => (
            <li key={info.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
              <span>
                <span className="font-medium">{info.titre}</span>
                {info.description && <span> — {info.description}</span>}
              </span>
              <form action={supprimerInfoImportante.bind(null, id, info.id)}>
                <button className="text-xs text-red-600">Supprimer</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={ajouterInfoImportante.bind(null, id)} className="grid grid-cols-2 gap-2">
          <select name="type" className="input-large">
            <option value="ALLERGIE">Allergie</option>
            <option value="REGIME_ALIMENTAIRE">Régime alimentaire</option>
            <option value="PROTOCOLE">Protocole</option>
            <option value="OBJET_TRANSITIONNEL">Objet transitionnel</option>
            <option value="AUTRE">Autre</option>
          </select>
          <input name="titre" placeholder="Titre" className="input-large" required />
          <input name="description" placeholder="Description" className="input-large col-span-2" />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="critique" className="h-5 w-5" /> Information critique
          </label>
          <button className="btn-secondary col-span-2">Ajouter</button>
        </form>
      </div>
    </div>
  );
}
