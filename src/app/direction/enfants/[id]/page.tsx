import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { formatDate, formatHeure } from "@/lib/format";
import { getAcquisitionsEnfant, getBadgesCompetences } from "@/lib/competences";
import { getJournalDuJour } from "@/lib/data";
import { OPTIONS_LIEN } from "@/lib/famille";
import { ICONES_EVENEMENT, LIBELLES_EVENEMENT, parseJson, resumeEvenement } from "@/lib/journal";
import { EnTeteEnfant } from "@/components/fiche/EnTeteEnfant";
import { TuilesAujourdhui } from "@/components/fiche/TuilesAujourdhui";
import { BadgesCompetences } from "@/components/fiche/BadgesCompetences";
import { GaleriePhotos } from "@/components/fiche/GaleriePhotos";
import { CarteParents } from "@/components/fiche/CarteParents";
import { Tabs } from "@/components/fiche/Tabs";
import {
  modifierFicheEnfant,
  modifierPhotoEnfant,
  ajouterParent,
  definirContactUrgencePrincipal,
  retirerParent,
  ajouterInfoImportante,
  supprimerInfoImportante,
  corrigerAcquisition,
  supprimerAcquisition,
  ajouterPhotoSouvenir,
  supprimerPhotoSouvenir,
  ajouterDocument,
  supprimerDocument,
} from "../actions";

const MAX_PARENTS = 2;

const LIBELLES_TYPE_DOC: Record<string, string> = {
  CONTRAT: "Contrat",
  AUTORISATION: "Autorisation",
  ORDONNANCE: "Ordonnance",
  JUSTIFICATIF: "Justificatif",
  AUTRE: "Autre",
};

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
        photos: { orderBy: { createdAt: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.groupe.findMany({ where: { garderieId: user.garderieId! } }),
  ]);
  if (!enfant) notFound();

  const [acquisitions, badges, journal] = await Promise.all([
    getAcquisitionsEnfant(id),
    getBadgesCompetences(id, user.garderieId!),
    getJournalDuJour(id),
  ]);

  const referente = enfant.affectations.find((a) => a.referente)?.professionnel;
  const derniereCompetence = acquisitions[0]?.competence;
  const petitMot = journal.find(
    (e) => e.type === "OBSERVATION" && e.commentaire && !e.commentaire.startsWith("[Transmission parent]")
  );
  const notes = journal.filter((e) => e.commentaire).slice(-5).reverse();
  const peutAjouterParent = enfant.parents.length < MAX_PARENTS;

  return (
    <div className="space-y-4">
      <EnTeteEnfant
        enfant={enfant}
        referente={referente ? `${referente.prenom} ${referente.nom}` : undefined}
        petitMot={petitMot?.commentaire}
        derniereCompetence={derniereCompetence}
        actions={
          <form action={modifierPhotoEnfant.bind(null, id)} className="flex items-center gap-2">
            <input type="file" name="photo" accept="image/*" className="text-xs" />
            <button className="btn-secondary text-xs">Changer la photo</button>
          </form>
        }
      />

      <Tabs
        tabs={[
          {
            id: "apercu",
            label: "Vue d'ensemble",
            icone: "🏠",
            content: (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <CarteParents parents={enfant.parents} />

                  <div className="card space-y-2">
                    <p className="font-semibold">ℹ️ Informations pratiques</p>
                    <p className="text-sm">📍 {enfant.adresse || "Adresse non renseignée"}</p>
                    <p className="text-sm">👥 Groupe : {enfant.groupe?.nom ?? "Sans groupe"}</p>
                  </div>

                  <div className="card space-y-2 border-2 border-amber-200 bg-amber-50">
                    <p className="font-semibold text-amber-800">⚠️ Allergies / informations importantes</p>
                    {enfant.infosImportantes.length === 0 && (
                      <p className="text-sm text-amber-700">Aucune information particulière.</p>
                    )}
                    <ul className="space-y-1 text-sm text-amber-900">
                      {enfant.infosImportantes.map((info) => (
                        <li key={info.id}>
                          <span className="font-medium">{info.titre}</span>
                          {info.description && <span> — {info.description}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="card space-y-3">
                    <p className="font-semibold">📅 Aujourd&apos;hui</p>
                    <TuilesAujourdhui journal={journal} />
                  </div>

                  {notes.length > 0 && (
                    <div className="card space-y-2">
                      <p className="font-semibold">📝 Dernières notes</p>
                      {notes.map((n) => (
                        <div key={n.id} className="rounded-lg bg-stone-50 px-3 py-2 text-sm">
                          <p>{n.commentaire}</p>
                          <p className="text-xs text-stone-400">{formatHeure(n.timestamp)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <BadgesCompetences badges={badges} />

                  <GaleriePhotos
                    photos={enfant.photos}
                    ajouterAction={ajouterPhotoSouvenir.bind(null, id)}
                    supprimerAction={supprimerPhotoSouvenir.bind(null, id)}
                  />
                </div>
              </div>
            ),
          },
          {
            id: "infos",
            label: "Informations",
            icone: "📋",
            content: (
              <div className="space-y-4">
                <form action={modifierFicheEnfant.bind(null, id)} className="space-y-4">
                  <div className="card space-y-3">
                    <p className="font-semibold">Statut, groupe & adresse</p>
                    <div className="grid grid-cols-2 gap-2">
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
                    </div>
                    <input
                      name="adresse"
                      defaultValue={enfant.adresse ?? ""}
                      placeholder="📍 Adresse de la famille"
                      className="input-large w-full"
                    />
                  </div>

                  {enfant.parents.length > 0 && (
                    <div className="card space-y-3">
                      <p className="font-semibold">👪 Parents</p>
                      <div className="space-y-3">
                        {enfant.parents.map((p) => (
                          <div key={p.id} className="rounded-xl border border-stone-200 p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                name={`parent_${p.id}_prenom`}
                                defaultValue={p.user.prenom}
                                placeholder="Prénom"
                                className="input-large text-sm"
                                required
                              />
                              <input
                                name={`parent_${p.id}_nom`}
                                defaultValue={p.user.nom}
                                placeholder="Nom"
                                className="input-large text-sm"
                                required
                              />
                              <input
                                name={`parent_${p.id}_telephone`}
                                defaultValue={p.user.telephone ?? ""}
                                placeholder="Téléphone"
                                className="input-large text-sm"
                              />
                              <input
                                name={`parent_${p.id}_email`}
                                type="email"
                                defaultValue={p.user.email}
                                placeholder="Email"
                                className="input-large text-sm"
                                required
                              />
                              <select name={`parent_${p.id}_lien`} defaultValue={p.lien} className="input-large text-sm col-span-2">
                                {OPTIONS_LIEN.map((o) => (
                                  <option key={o.valeur} value={o.valeur}>
                                    {o.libelle}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center justify-between border-t border-stone-100 pt-2">
                              {p.estContactUrgence ? (
                                <span className="pill bg-orange-100 text-orange-700">★ Contact d&apos;urgence principal</span>
                              ) : (
                                <button
                                  type="submit"
                                  formAction={definirContactUrgencePrincipal.bind(null, id, p.id)}
                                  className="text-sm text-orange-600"
                                >
                                  Définir comme contact d&apos;urgence principal
                                </button>
                              )}
                              <button type="submit" formAction={retirerParent.bind(null, id, p.id)} className="text-xs text-red-600">
                                Retirer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="btn-primary w-full">Enregistrer</button>
                </form>

                {peutAjouterParent && (
                  <div className="card space-y-3">
                    <form action={ajouterParent.bind(null, id)} className="grid grid-cols-2 gap-2">
                      <p className="col-span-2 text-sm text-stone-500">
                        Ajouter un parent ({enfant.parents.length}/{MAX_PARENTS})
                      </p>
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
                      <button className="btn-secondary col-span-2">Ajouter ce parent</button>
                    </form>
                  </div>
                )}

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
              </div>
            ),
          },
          {
            id: "competences",
            label: "Compétences",
            icone: "🌱",
            content: (
              <div className="card space-y-3">
                <p className="font-semibold">Compétences observées</p>
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
            ),
          },
          {
            id: "documents",
            label: "Documents",
            icone: "📄",
            content: (
              <div className="card space-y-3">
                <p className="font-semibold">Documents</p>
                <ul className="space-y-2 text-sm">
                  {enfant.documents.map((d) => (
                    <li key={d.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-orange-700 hover:underline">
                        📄 {d.nom} — {LIBELLES_TYPE_DOC[d.type]}
                      </a>
                      <form action={supprimerDocument.bind(null, id, d.id)}>
                        <button className="text-xs text-red-600">Supprimer</button>
                      </form>
                    </li>
                  ))}
                  {enfant.documents.length === 0 && <p className="text-stone-500">Aucun document.</p>}
                </ul>
                <form action={ajouterDocument.bind(null, id)} className="grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
                  <input name="nom" placeholder="Nom du document" className="input-large text-sm col-span-2" required />
                  <select name="type" className="input-large text-sm">
                    <option value="CONTRAT">Contrat</option>
                    <option value="AUTORISATION">Autorisation</option>
                    <option value="ORDONNANCE">Ordonnance</option>
                    <option value="JUSTIFICATIF">Justificatif</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                  <input type="file" name="fichier" required className="text-sm" />
                  <button className="btn-secondary col-span-2">Ajouter le document</button>
                </form>
              </div>
            ),
          },
          {
            id: "historique",
            label: "Historique",
            icone: "📅",
            content: (
              <div className="card">
                <p className="mb-3 font-semibold">Timeline de la journée</p>
                {journal.length === 0 && <p className="text-sm text-stone-500">Aucun événement aujourd&apos;hui.</p>}
                <ul className="space-y-3">
                  {[...journal].reverse().map((evt) => (
                    <li key={evt.id} className="flex gap-3 border-b border-stone-100 pb-2 last:border-0">
                      <span className="w-14 shrink-0 text-sm text-stone-500">{formatHeure(evt.timestamp)}</span>
                      <span className="text-xl">{ICONES_EVENEMENT[evt.type]}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {LIBELLES_EVENEMENT[evt.type]}{" "}
                          <span className="font-normal text-stone-600">
                            {resumeEvenement(evt.type, parseJson(evt.donneesReelles))}
                          </span>
                        </p>
                        {evt.commentaire && <p className="text-sm text-stone-500">{evt.commentaire}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
