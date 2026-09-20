import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { calculerAge, formatDate } from "@/lib/format";
import { getAcquisitionsEnfant } from "@/lib/competences";
import { OPTIONS_LIEN } from "@/lib/famille";
import {
  modifierStatutEnfant,
  modifierAdresse,
  ajouterParent,
  modifierParent,
  definirContactUrgencePrincipal,
  retirerParent,
  ajouterInfoImportante,
  supprimerInfoImportante,
  corrigerAcquisition,
  supprimerAcquisition,
} from "../actions";

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

  const acquisitions = await getAcquisitionsEnfant(id);

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

      <div className="card space-y-3">
        <p className="font-semibold">📍 Adresse</p>
        <form action={modifierAdresse.bind(null, id)} className="flex gap-2">
          <input
            name="adresse"
            defaultValue={enfant.adresse ?? ""}
            placeholder="Adresse de la famille"
            className="input-large flex-1"
          />
          <button className="btn-secondary">Enregistrer</button>
        </form>
      </div>

      <div className="card space-y-3">
        <p className="font-semibold">👪 Parents</p>
        {enfant.parents.length === 0 && <p className="text-sm text-stone-500">Aucun parent lié.</p>}

        <div className="space-y-3">
          {enfant.parents.map((p) => (
            <div key={p.id} className="rounded-xl border border-stone-200 p-3 space-y-2">
              <form action={modifierParent.bind(null, id, p.id)} className="grid grid-cols-2 gap-2">
                <input name="prenom" defaultValue={p.user.prenom} placeholder="Prénom" className="input-large text-sm" required />
                <input name="nom" defaultValue={p.user.nom} placeholder="Nom" className="input-large text-sm" required />
                <input
                  name="telephone"
                  defaultValue={p.user.telephone ?? ""}
                  placeholder="Téléphone"
                  className="input-large text-sm"
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={p.user.email}
                  placeholder="Email"
                  className="input-large text-sm"
                  required
                />
                <select name="lien" defaultValue={p.lien} className="input-large text-sm col-span-2">
                  {OPTIONS_LIEN.map((o) => (
                    <option key={o.valeur} value={o.valeur}>
                      {o.libelle}
                    </option>
                  ))}
                </select>
                <button className="btn-secondary col-span-2 text-sm">Enregistrer</button>
              </form>

              <div className="flex items-center justify-between border-t border-stone-100 pt-2">
                {p.estContactUrgence ? (
                  <span className="pill bg-orange-100 text-orange-700">★ Contact d&apos;urgence principal</span>
                ) : (
                  <form action={definirContactUrgencePrincipal.bind(null, id, p.id)}>
                    <button className="text-sm text-orange-600">Définir comme contact d&apos;urgence principal</button>
                  </form>
                )}
                <form action={retirerParent.bind(null, id, p.id)}>
                  <button className="text-xs text-red-600">Retirer</button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <form action={ajouterParent.bind(null, id)} className="grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
          <p className="col-span-2 text-sm text-stone-500">Ajouter un parent</p>
          <input name="prenom" placeholder="Prénom" className="input-large text-sm" required />
          <input name="nom" placeholder="Nom" className="input-large text-sm" required />
          <input name="telephone" placeholder="Téléphone" className="input-large text-sm" />
          <select name="lien" className="input-large text-sm" defaultValue="AUTRE">
            {OPTIONS_LIEN.map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.libelle}
              </option>
            ))}
          </select>
          <input name="email" type="email" placeholder="Email" className="input-large text-sm col-span-2" required />
          <input
            name="motDePasse"
            type="password"
            placeholder="Mot de passe initial"
            className="input-large text-sm col-span-2"
            required
            minLength={8}
          />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="estContactUrgence" className="h-5 w-5" /> Contact d&apos;urgence principal
          </label>
          <button className="btn-primary col-span-2">Ajouter ce parent</button>
        </form>
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

      <div className="card space-y-3">
        <p className="font-semibold">🌱 Compétences observées</p>
        {acquisitions.length === 0 && <p className="text-sm text-stone-500">Aucune compétence enregistrée.</p>}
        <ul className="space-y-3">
          {acquisitions.map((a) => (
            <li key={a.id} className="rounded-lg bg-stone-50 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {a.competence.icone ?? a.competence.categorie.icone} {a.competence.nom}{" "}
                    <span className="font-normal text-stone-400">— {formatDate(a.dateObservation)}</span>
                  </p>
                  <p className="text-xs text-stone-400">
                    observé par {a.auteur.prenom} {a.auteur.nom}
                    {a.modifiePar && ` · corrigé par ${a.modifiePar.prenom} le ${formatDate(a.modifieLe!)}`}
                  </p>
                  {a.noteOriginale && (
                    <p className="text-xs text-stone-400 italic">note d&apos;origine : « {a.noteOriginale} »</p>
                  )}
                </div>
                <form action={supprimerAcquisition.bind(null, id, a.id)}>
                  <button className="text-xs text-red-600">Supprimer</button>
                </form>
              </div>
              <form action={corrigerAcquisition.bind(null, id, a.id)} className="mt-2 flex gap-2">
                <input name="note" defaultValue={a.note ?? ""} placeholder="Note" className="input-large flex-1 text-sm" />
                <button className="btn-secondary text-sm">Corriger</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
