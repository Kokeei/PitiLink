import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { formatDate, formatHeure } from "@/lib/format";
import { getAcquisitionsEnfant, getBadgesCompetences } from "@/lib/competences";
import { getJournalDuJour, getActivitesRecentes } from "@/lib/data";
import { OPTIONS_LIEN } from "@/lib/famille";
import { ICONES_EVENEMENT, LIBELLES_EVENEMENT, parseJson, resumeEvenement } from "@/lib/journal";
import {
  JOURS_MENU,
  lundiDeLaSemaine,
  resoudreMenuEnfant,
  detecterConflitsAllergie,
  type EntreeMenu,
} from "@/lib/menus";
import {
  traitementsEnCours,
  documentsParCategorie,
  construireHistorique,
  LIBELLES_CATEGORIE_DOCUMENT,
  type CategorieDocument,
} from "@/lib/enfants";
import { FicheHeader } from "@/components/fiche/FicheHeader";
import { BadgesCompetences } from "@/components/fiche/BadgesCompetences";
import { GaleriePhotos } from "@/components/fiche/GaleriePhotos";
import { CarteParents } from "@/components/fiche/CarteParents";
import { Tabs } from "@/components/fiche/Tabs";
import {
  modifierFicheEnfant,
  modifierPhotoEnfant,
  modifierAccueil,
  modifierMedecin,
  ajouterParent,
  definirContactUrgencePrincipal,
  reinitialiserMotDePasseParent,
  retirerParent,
  ajouterInfoImportante,
  supprimerInfoImportante,
  ajouterAllergieEnfant,
  supprimerAllergieEnfant,
  ajouterTraitement,
  supprimerTraitement,
  ajouterPersonneAutorisee,
  supprimerPersonneAutorisee,
  changerStatutEnfant,
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

const ORDRE_CATEGORIES_DOCUMENT: CategorieDocument[] = ["ADMINISTRATIF", "SANTE", "AUTRES"];

export default async function FicheEnfantDirectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date: dateParam } = await searchParams;
  const user = await requireUser(ROLES_DIRECTION);
  const garderieId = user.garderieId!;

  const [enfant, groupes, allergenes, aliments] = await Promise.all([
    prisma.enfant.findFirst({
      where: { id, garderieId },
      include: {
        groupe: true,
        infosImportantes: true,
        allergies: { include: { allergene: true }, orderBy: { createdAt: "asc" } },
        parents: { include: { user: true } },
        affectations: { include: { professionnel: true } },
        photos: { orderBy: { createdAt: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        personnesAutorisees: true,
        contactsUrgence: { orderBy: { ordrePriorite: "asc" } },
        traitements: { orderBy: { dateFin: "desc" } },
        historique: { orderBy: { date: "desc" } },
      },
    }),
    prisma.groupe.findMany({ where: { garderieId }, orderBy: { nom: "asc" } }),
    prisma.allergene.findMany({ where: { garderieId, actif: true }, orderBy: { nom: "asc" } }),
    prisma.aliment.findMany({ where: { garderieId }, include: { allergenes: { include: { allergene: true } } } }),
  ]);
  if (!enfant) notFound();

  const allergenesDisponibles = allergenes.filter((a) => !enfant.allergies.some((al) => al.allergeneId === a.id));

  const dateAffichee = dateParam ? new Date(dateParam) : new Date();
  const veille = new Date(dateAffichee);
  veille.setDate(veille.getDate() - 1);
  const lendemain = new Date(dateAffichee);
  lendemain.setDate(lendemain.getDate() + 1);

  const lundi = lundiDeLaSemaine();
  const [acquisitions, badges, journal, activitesRecentes, semaineMenu, typesRepas] = await Promise.all([
    getAcquisitionsEnfant(id),
    getBadgesCompetences(id, garderieId),
    getJournalDuJour(id, dateAffichee),
    getActivitesRecentes(id),
    prisma.semaineMenu.findUnique({
      where: { garderieId_dateDebut: { garderieId, dateDebut: lundi } },
      include: { entrees: { include: { composants: { include: { aliment: true, remplaceAliment: true }, orderBy: { ordre: "asc" } } } } },
    }),
    prisma.typeRepas.findMany({ where: { garderieId, actif: true }, orderBy: { ordre: "asc" } }),
  ]);

  const referente = enfant.affectations.find((a) => a.referente)?.professionnel;
  const petitMot = journal.find((e) => e.type === "OBSERVATION" && e.commentaire && !e.commentaire.startsWith("[Transmission parent]"));
  const peutAjouterParent = enfant.parents.length < MAX_PARENTS;

  const enCours = traitementsEnCours(enfant.traitements);
  const documentsGroupes = documentsParCategorie(enfant.documents);
  const historique = construireHistorique(enfant.historique, enfant.traitements);

  const allergenesParAliment = new Map(aliments.map((a) => [a.id, a.allergenes.map((al) => al.allergene)]));
  const entreesResolues: EntreeMenu[] = (semaineMenu?.entrees ?? []).map((e) => ({
    id: e.id,
    jourSemaine: e.jourSemaine,
    typeRepasId: e.typeRepasId,
    portee: e.portee,
    groupeId: e.groupeId,
    enfantId: e.enfantId,
    note: e.note,
    composants: e.composants.map((c) => ({
      id: c.id,
      alimentId: c.alimentId,
      alimentNom: c.aliment.nom,
      ordre: c.ordre,
      remplaceAlimentNom: c.remplaceAliment?.nom ?? null,
      motifRemplacement: c.motifRemplacement,
    })),
  }));

  return (
    <div className="space-y-4">
      <FicheHeader
        enfant={enfant}
        groupeNom={enfant.groupe?.nom}
        allergies={enfant.allergies.map((a) => a.allergene.nom)}
        retourHref="/direction/enfants"
        plusActions={
          <>
            {enfant.autorisationPhotos === "AUTORISEE" && (
              <form action={modifierPhotoEnfant.bind(null, id)} className="space-y-1 border-b border-stone-100 pb-2">
                <p className="px-1 text-xs text-stone-500">Photo de profil</p>
                <input type="file" name="photo" accept="image/*" className="w-full px-1 text-xs" />
                <button className="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-stone-50">Enregistrer la photo</button>
              </form>
            )}
            {enfant.statut !== "SUSPENDU" && (
              <form action={changerStatutEnfant.bind(null, id, "SUSPENDU")}>
                <button className="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-stone-50">⏸️ Suspendre</button>
              </form>
            )}
            {enfant.statut !== "ACTIF" && (
              <form action={changerStatutEnfant.bind(null, id, "ACTIF")}>
                <button className="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-stone-50">▶️ Réactiver</button>
              </form>
            )}
            {enfant.statut !== "ARCHIVE" && (
              <form action={changerStatutEnfant.bind(null, id, "ARCHIVE")}>
                <button className="w-full rounded-lg px-2 py-1 text-left text-sm text-red-600 hover:bg-red-50">🗄️ Archiver</button>
              </form>
            )}
          </>
        }
      />

      <Tabs
        tabs={[
          {
            id: "general",
            label: "Général",
            icone: "👤",
            content: (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="card space-y-3">
                    <p className="font-semibold">Informations</p>
                    <form action={modifierFicheEnfant.bind(null, id)} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input name="prenom" defaultValue={enfant.prenom} className="input-large" required />
                        <input name="nom" defaultValue={enfant.nom} className="input-large" required />
                        <label className="text-xs text-stone-500">
                          Date de naissance
                          <input name="dateNaissance" type="date" defaultValue={enfant.dateNaissance.toISOString().slice(0, 10)} className="input-large mt-1" />
                        </label>
                        <label className="text-xs text-stone-500">
                          Sexe
                          <select name="sexe" defaultValue={enfant.sexe ?? ""} className="input-large mt-1">
                            <option value="">Non renseigné</option>
                            <option value="FILLE">Fille</option>
                            <option value="GARCON">Garçon</option>
                          </select>
                        </label>
                        <label className="text-xs text-stone-500">
                          Groupe
                          <select name="groupeId" defaultValue={enfant.groupeId ?? ""} className="input-large mt-1">
                            <option value="">Sans groupe</option>
                            {groupes.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.nom}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-stone-500">
                          Date d&apos;entrée
                          <input
                            name="dateDebutAccueil"
                            type="date"
                            defaultValue={enfant.dateDebutAccueil?.toISOString().slice(0, 10) ?? ""}
                            className="input-large mt-1"
                          />
                        </label>
                        <label className="text-xs text-stone-500">
                          Statut
                          <select name="statut" defaultValue={enfant.statut} className="input-large mt-1">
                            <option value="ACTIF">Actif</option>
                            <option value="SUSPENDU">Suspendu</option>
                            <option value="SORTI">Sorti</option>
                            <option value="ARCHIVE">Archivé</option>
                          </select>
                        </label>
                      </div>
                      <input name="adresse" defaultValue={enfant.adresse ?? ""} placeholder="📍 Adresse de la famille" className="input-large w-full" />
                      <div>
                        <label className="mb-1 block text-xs text-stone-500">📷 Autorisation de diffusion des photos</label>
                        <select name="autorisationPhotos" defaultValue={enfant.autorisationPhotos} className="input-large w-full">
                          <option value="NON_RENSEIGNEE">Non renseignée</option>
                          <option value="AUTORISEE">Autorisée par la famille</option>
                          <option value="REFUSEE">Refusée par la famille</option>
                        </select>
                      </div>
                      <button className="btn-primary w-full">Enregistrer</button>
                    </form>
                  </div>

                  <CarteParents parents={enfant.parents} />
                  {enfant.parents.length > 0 && (
                    <div className="card space-y-3">
                      <p className="text-sm font-semibold text-stone-600">Gérer les responsables</p>
                      {enfant.parents.map((p) => (
                        <div key={p.id} className="space-y-2 rounded-xl border border-stone-200 p-3 text-sm">
                          <form action={modifierFicheEnfant.bind(null, id)} className="grid grid-cols-2 gap-2">
                            <input name={`parent_${p.id}_prenom`} defaultValue={p.user.prenom} placeholder="Prénom" className="input-large text-sm" required />
                            <input name={`parent_${p.id}_nom`} defaultValue={p.user.nom} placeholder="Nom" className="input-large text-sm" required />
                            <input name={`parent_${p.id}_telephone`} defaultValue={p.user.telephone ?? ""} placeholder="Téléphone" className="input-large text-sm" />
                            <input name={`parent_${p.id}_email`} type="email" defaultValue={p.user.email} placeholder="Email" className="input-large text-sm" required />
                            <select name={`parent_${p.id}_lien`} defaultValue={p.lien} className="input-large col-span-2 text-sm">
                              {OPTIONS_LIEN.map((o) => (
                                <option key={o.valeur} value={o.valeur}>
                                  {o.libelle}
                                </option>
                              ))}
                            </select>
                            <button className="btn-secondary col-span-2 text-xs">Enregistrer ce responsable</button>
                          </form>
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2">
                            {p.estContactUrgence ? (
                              <span className="pill bg-orange-100 text-xs text-orange-700">★ Contact d&apos;urgence principal</span>
                            ) : (
                              <form action={definirContactUrgencePrincipal.bind(null, id, p.id)}>
                                <button className="text-xs text-orange-600">Définir comme contact principal</button>
                              </form>
                            )}
                            <form action={retirerParent.bind(null, id, p.id)}>
                              <button className="text-xs text-red-600">Retirer</button>
                            </form>
                          </div>
                          <form action={reinitialiserMotDePasseParent.bind(null, p.userId, p.id)} className="flex items-center gap-2 border-t border-stone-100 pt-2">
                            <input name={`nouveauMotDePasse_${p.id}`} type="password" placeholder="Nouveau mot de passe" minLength={8} className="input-large flex-1 text-xs" />
                            <button className="btn-secondary shrink-0 text-xs">🔑 Réinitialiser</button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                  {peutAjouterParent && (
                    <div className="card space-y-2">
                      <p className="text-sm font-semibold text-stone-600">
                        + Ajouter un responsable ({enfant.parents.length}/{MAX_PARENTS})
                      </p>
                      <form action={ajouterParent.bind(null, id)} className="grid grid-cols-2 gap-2">
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
                        <input name="email" type="email" placeholder="Email" className="input-large col-span-2 text-sm" required />
                        <input name="motDePasse" type="password" placeholder="Mot de passe initial" className="input-large col-span-2 text-sm" required minLength={8} />
                        <label className="col-span-2 flex items-center gap-2 text-sm">
                          <input type="checkbox" name="estContactUrgence" className="h-4 w-4" /> Contact d&apos;urgence principal
                        </label>
                        <button className="btn-secondary col-span-2">Ajouter</button>
                      </form>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="card space-y-3">
                    <p className="font-semibold">🪪 Personnes autorisées</p>
                    <ul className="space-y-2 text-sm">
                      {enfant.personnesAutorisees.map((p) => (
                        <li key={p.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                          <span>
                            {p.prenom} {p.nom} <span className="text-stone-400">— {p.lien}</span>
                            {p.ponctuelle && <span className="pill ml-1 bg-orange-100 text-[10px] text-orange-700">Ponctuelle</span>}
                          </span>
                          <form action={supprimerPersonneAutorisee.bind(null, id, p.id)}>
                            <button className="text-xs text-red-600">Retirer</button>
                          </form>
                        </li>
                      ))}
                      {enfant.personnesAutorisees.length === 0 && <p className="text-sm text-stone-400">Aucune personne autorisée déclarée.</p>}
                    </ul>
                    <details>
                      <summary className="cursor-pointer select-none text-sm text-orange-600">+ Ajouter une personne</summary>
                      <form action={ajouterPersonneAutorisee.bind(null, id)} className="mt-2 grid grid-cols-2 gap-2">
                        <input name="prenom" placeholder="Prénom" className="input-large text-sm" required />
                        <input name="nom" placeholder="Nom" className="input-large text-sm" required />
                        <input name="lien" placeholder="Lien (ex. Tante)" className="input-large text-sm" required />
                        <input name="telephone" placeholder="Téléphone" className="input-large text-sm" />
                        <label className="col-span-2 flex items-center gap-2 text-sm">
                          <input type="checkbox" name="ponctuelle" className="h-4 w-4" /> Autorisation ponctuelle uniquement
                        </label>
                        <button className="btn-secondary col-span-2 text-xs">Ajouter</button>
                      </form>
                    </details>
                  </div>

                  <div className="card space-y-3">
                    <p className="font-semibold">🗓️ Accueil</p>
                    {referente && <p className="text-sm text-stone-500">Référente : {referente.prenom} {referente.nom}</p>}
                    <form action={modifierAccueil.bind(null, id)} className="space-y-2">
                      <div>
                        <p className="mb-1 text-xs text-stone-500">Jours de présence</p>
                        <div className="flex flex-wrap gap-3">
                          {JOURS_MENU.map((j) => (
                            <label key={j} className="flex items-center gap-1.5 text-sm">
                              <input type="checkbox" name="joursPresence" value={j} defaultChecked={enfant.joursPresence.includes(j)} className="h-4 w-4" />
                              {j}
                            </label>
                          ))}
                        </div>
                      </div>
                      <input name="horaireHabituel" defaultValue={enfant.horaireHabituel ?? ""} placeholder="Horaires habituels (ex. 07h30 - 18h30)" className="input-large" />
                      <button className="btn-secondary w-full text-sm">Enregistrer</button>
                    </form>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "sante",
            label: "Santé",
            icone: "❤️",
            content: (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="card space-y-3 border-2 border-red-100">
                    <p className="font-semibold text-red-800">🔴 Allergies</p>
                    <ul className="space-y-2 text-sm">
                      {enfant.allergies.map((a) => (
                        <li key={a.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                          <span className="font-medium text-red-800">{a.allergene.nom}</span>
                          <form action={supprimerAllergieEnfant.bind(null, id, a.id)}>
                            <button className="text-xs text-red-600">Retirer</button>
                          </form>
                        </li>
                      ))}
                      {enfant.allergies.length === 0 && <p className="text-sm text-stone-400">Aucune allergie déclarée.</p>}
                    </ul>
                    {allergenesDisponibles.length > 0 && (
                      <form action={ajouterAllergieEnfant.bind(null, id)} className="flex gap-2 border-t border-stone-100 pt-2">
                        <select name="allergeneId" className="input-large flex-1 text-sm" required>
                          {allergenesDisponibles.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.nom}
                            </option>
                          ))}
                        </select>
                        <button className="btn-secondary shrink-0 text-xs">+ Ajouter</button>
                      </form>
                    )}
                  </div>

                  <div className="card space-y-3">
                    <p className="font-semibold">💊 Traitement en cours</p>
                    {enCours.length === 0 ? (
                      <p className="text-sm text-emerald-700">🟢 Aucun traitement en cours</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {enCours.map((t) => (
                          <li key={t.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                            <span>
                              <span className="font-medium">{t.nom}</span> — jusqu&apos;au {formatDate(t.dateFin)}
                            </span>
                            <form action={supprimerTraitement.bind(null, id, t.id)}>
                              <button className="text-xs text-red-600">Terminer</button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                    <details>
                      <summary className="cursor-pointer select-none text-sm text-orange-600">+ Ajouter un traitement</summary>
                      <form action={ajouterTraitement.bind(null, id)} className="mt-2 grid grid-cols-2 gap-2">
                        <input name="nom" placeholder="Nom du traitement" className="input-large col-span-2 text-sm" required />
                        <label className="col-span-2 text-xs text-stone-500">
                          Date de fin
                          <input name="dateFin" type="date" className="input-large mt-1" required />
                        </label>
                        <input name="note" placeholder="Note (optionnel)" className="input-large col-span-2 text-sm" />
                        <button className="btn-secondary col-span-2 text-xs">Ajouter</button>
                      </form>
                    </details>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="card space-y-3">
                    <p className="font-semibold">ℹ️ Informations importantes</p>
                    <ul className="space-y-2 text-sm">
                      {enfant.infosImportantes.map((info) => (
                        <li key={info.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                          <span>
                            <span className="font-medium">{info.titre}</span>
                            {info.description && <span className="text-stone-600"> — {info.description}</span>}
                          </span>
                          <form action={supprimerInfoImportante.bind(null, id, info.id)}>
                            <button className="text-xs text-red-600">Retirer</button>
                          </form>
                        </li>
                      ))}
                      {enfant.infosImportantes.length === 0 && <p className="text-sm text-stone-400">Aucune information particulière pour le moment.</p>}
                    </ul>
                    <details>
                      <summary className="cursor-pointer select-none text-sm text-orange-600">+ Ajouter</summary>
                      <form action={ajouterInfoImportante.bind(null, id)} className="mt-2 grid grid-cols-2 gap-2">
                        <select name="type" className="input-large col-span-2 text-sm">
                          <option value="REGIME_ALIMENTAIRE">Régime alimentaire</option>
                          <option value="PROTOCOLE">Protocole</option>
                          <option value="OBJET_TRANSITIONNEL">Objet transitionnel</option>
                          <option value="AUTRE">Autre</option>
                        </select>
                        <input name="titre" placeholder="Titre" className="input-large col-span-2 text-sm" required />
                        <input name="description" placeholder="Description" className="input-large col-span-2 text-sm" />
                        <label className="col-span-2 flex items-center gap-2 text-sm">
                          <input type="checkbox" name="critique" className="h-4 w-4" /> Information critique
                        </label>
                        <button className="btn-secondary col-span-2 text-xs">Ajouter</button>
                      </form>
                    </details>
                  </div>

                  <div className="card space-y-3">
                    <p className="font-semibold">📄 Documents santé</p>
                    <ul className="space-y-2 text-sm">
                      {documentsGroupes.SANTE.map((d) => (
                        <li key={d.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                          <a href={d.url} target="_blank" rel="noreferrer" className="text-orange-700 hover:underline">
                            📄 {d.nom}
                          </a>
                          <form action={supprimerDocument.bind(null, id, d.id)}>
                            <button className="text-xs text-red-600">Supprimer</button>
                          </form>
                        </li>
                      ))}
                      {documentsGroupes.SANTE.length === 0 && <p className="text-sm text-stone-400">Aucun document santé.</p>}
                    </ul>
                    <details>
                      <summary className="cursor-pointer select-none text-sm text-orange-600">+ Ajouter (ordonnance, protocole...)</summary>
                      <form action={ajouterDocument.bind(null, id)} className="mt-2 space-y-2">
                        <input type="hidden" name="type" value="ORDONNANCE" />
                        <input name="nom" placeholder="Nom du document" className="input-large text-sm" required />
                        <input type="file" name="fichier" required className="text-sm" />
                        <button className="btn-secondary w-full text-xs">Ajouter</button>
                      </form>
                    </details>
                  </div>
                </div>

                <div className="card space-y-3 border-2 border-amber-200 bg-amber-50">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-amber-900">🚨 En cas d&apos;urgence</p>
                    <details className="relative">
                      <summary className="cursor-pointer select-none text-xs text-amber-700">Modifier le médecin</summary>
                      <form
                        action={modifierMedecin.bind(null, id)}
                        className="absolute right-0 z-10 mt-1 w-64 space-y-2 rounded-xl border border-stone-200 bg-white p-3 text-sm shadow-md"
                      >
                        <input name="medecinNom" defaultValue={enfant.medecinNom ?? ""} placeholder="Nom du médecin" className="input-large text-sm" />
                        <input name="medecinTelephone" defaultValue={enfant.medecinTelephone ?? ""} placeholder="Téléphone" className="input-large text-sm" />
                        <button className="btn-secondary w-full text-xs">Enregistrer</button>
                      </form>
                    </details>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-amber-700">Contact d&apos;urgence</p>
                      {enfant.contactsUrgence.length > 0 ? (
                        enfant.contactsUrgence.map((c) => (
                          <p key={c.id} className="text-sm text-amber-900">
                            {c.telephone} <span className="text-amber-700">({c.prenom} {c.nom})</span>
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-amber-700">Non renseigné.</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-amber-700">Médecin traitant</p>
                      {enfant.medecinNom ? (
                        <>
                          <p className="text-sm text-amber-900">{enfant.medecinNom}</p>
                          {enfant.medecinTelephone && <p className="text-sm text-amber-900">{enfant.medecinTelephone}</p>}
                        </>
                      ) : (
                        <p className="text-sm text-amber-700">Non renseigné.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "quotidien",
            label: "Suivi quotidien",
            icone: "📋",
            content: (
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <Link href={`?date=${veille.toISOString().slice(0, 10)}#onglet-quotidien`} className="text-sm text-orange-600">
                    ← Veille
                  </Link>
                  <p className="font-semibold">{formatDate(dateAffichee)}</p>
                  <Link href={`?date=${lendemain.toISOString().slice(0, 10)}#onglet-quotidien`} className="text-sm text-orange-600">
                    Lendemain →
                  </Link>
                </div>
                {petitMot && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm italic text-green-800">💬 « {petitMot.commentaire} »</p>}
                {journal.length === 0 && <p className="text-sm text-stone-500">Aucun événement ce jour-là.</p>}
                <ul className="space-y-3">
                  {[...journal].reverse().map((evt) => (
                    <li key={evt.id} className="flex gap-3 border-b border-stone-100 pb-2 last:border-0">
                      <span className="w-14 shrink-0 text-sm text-stone-500">{formatHeure(evt.timestamp)}</span>
                      <span className="text-xl">{ICONES_EVENEMENT[evt.type]}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {LIBELLES_EVENEMENT[evt.type]} <span className="font-normal text-stone-600">{resumeEvenement(evt.type, parseJson(evt.donneesReelles))}</span>
                        </p>
                        {evt.commentaire && <p className="text-sm text-stone-500">{evt.commentaire}</p>}
                        {evt.auteur && <p className="text-xs text-stone-400">par {evt.auteur.prenom}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          },
          {
            id: "menus",
            label: "Menus",
            icone: "🍽️",
            content: (
              <div className="space-y-3">
                {!semaineMenu && <p className="card text-sm text-stone-500">Aucun menu défini pour cette semaine.</p>}
                {semaineMenu?.statut === "BROUILLON" && (
                  <p className="card text-sm text-amber-700">⚠️ Cette semaine est encore en brouillon — non visible des parents.</p>
                )}
                {JOURS_MENU.map((j, jour) => (
                  <div key={j} className="card space-y-2">
                    <p className="font-semibold">{j.toUpperCase()}</p>
                    <ul className="space-y-1.5 text-sm">
                      {typesRepas.map((type) => {
                        const resolu = resoudreMenuEnfant(entreesResolues, { id: enfant.id, groupeId: enfant.groupeId }, jour, type.id);
                        const conflits = resolu
                          ? detecterConflitsAllergie(
                              resolu.composants.map((c) => ({ alimentId: c.alimentId, alimentNom: c.alimentNom, allergeneIds: (allergenesParAliment.get(c.alimentId) ?? []).map((a) => a.id) })),
                              [{ id: enfant.id, nomComplet: `${enfant.prenom} ${enfant.nom}`, allergies: enfant.allergies.map((a) => ({ allergeneId: a.allergeneId, allergeneNom: a.allergene.nom })) }]
                            )
                          : [];
                        return (
                          <li key={type.id}>
                            <span className="font-medium">{type.nom} :</span>{" "}
                            {resolu ? resolu.composants.map((c) => c.alimentNom).join(", ") : <span className="text-stone-400">non défini</span>}{" "}
                            {resolu?.portee === "GENERAL" && <span className="text-xs text-stone-400">Menu général</span>}
                            {resolu?.portee === "CATEGORIE" && <span className="pill bg-violet-100 text-[10px] text-violet-700">🏷️ Adapté au groupe</span>}
                            {resolu?.portee === "INDIVIDUEL" && <span className="pill bg-orange-100 text-[10px] text-orange-700">🔄 Menu personnalisé</span>}
                            {conflits.length > 0 && (
                              <span className="ml-1 block text-xs text-red-600">
                                ⚠️ Contient {conflits.map((c) => c.alimentNom).join(", ")} — allergène déclaré
                              </span>
                            )}
                          </li>
                        );
                      })}
                      {typesRepas.length === 0 && <p className="text-stone-400">Aucun type de repas configuré.</p>}
                    </ul>
                  </div>
                ))}
              </div>
            ),
          },
          {
            id: "activites",
            label: "Activités",
            icone: "🌱",
            content: (
              <div className="space-y-4">
                <BadgesCompetences badges={badges} />

                <div className="card space-y-3">
                  <p className="font-semibold">🎨 Activités récentes</p>
                  {activitesRecentes.length === 0 && <p className="text-sm text-stone-500">Aucune activité enregistrée récemment.</p>}
                  <ul className="space-y-1 text-sm">
                    {activitesRecentes.map((a) => (
                      <li key={a.id} className="flex items-center justify-between border-b border-stone-100 pb-1 last:border-0">
                        <span>{resumeEvenement("ACTIVITE", parseJson(a.donneesReelles)) || "Activité"}</span>
                        <span className="text-xs text-stone-400">{formatDate(a.timestamp)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card space-y-3">
                  <p className="font-semibold">✓ Compétences observées</p>
                  {acquisitions.length === 0 && <p className="text-sm text-stone-500">Aucune compétence enregistrée.</p>}
                  <ul className="space-y-3">
                    {acquisitions.map((a) => (
                      <li key={a.id} className="rounded-lg bg-stone-50 p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">
                              ✓ {a.competence.icone ?? a.competence.categorie.icone} {a.competence.nom}{" "}
                              <span className="font-normal text-stone-400">— {formatDate(a.dateObservation)}</span>
                            </p>
                            <p className="text-xs text-stone-400">
                              observé par {a.auteur.prenom} {a.auteur.nom}
                              {a.modifiePar && ` · corrigé par ${a.modifiePar.prenom} le ${formatDate(a.modifieLe!)}`}
                            </p>
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

                <GaleriePhotos photos={enfant.photos} ajouterAction={ajouterPhotoSouvenir.bind(null, id)} supprimerAction={supprimerPhotoSouvenir.bind(null, id)} autorisation={enfant.autorisationPhotos} />
              </div>
            ),
          },
          {
            id: "documents",
            label: "Documents",
            icone: "📁",
            content: (
              <div className="space-y-4">
                {ORDRE_CATEGORIES_DOCUMENT.map((cat) => (
                  <div key={cat} className="card space-y-2">
                    <p className="font-semibold">{LIBELLES_CATEGORIE_DOCUMENT[cat]}</p>
                    <ul className="space-y-2 text-sm">
                      {documentsGroupes[cat].map((d) => (
                        <li key={d.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                          <a href={d.url} target="_blank" rel="noreferrer" className="text-orange-700 hover:underline">
                            📄 {d.nom} <span className="text-xs text-stone-400">— {LIBELLES_TYPE_DOC[d.type]} · {formatDate(d.createdAt)}</span>
                          </a>
                          <form action={supprimerDocument.bind(null, id, d.id)}>
                            <button className="text-xs text-red-600">Supprimer</button>
                          </form>
                        </li>
                      ))}
                      {documentsGroupes[cat].length === 0 && <p className="text-stone-400">Aucun document.</p>}
                    </ul>
                  </div>
                ))}
                <div className="card">
                  <form action={ajouterDocument.bind(null, id)} className="grid grid-cols-2 gap-2">
                    <input name="nom" placeholder="Nom du document" className="input-large col-span-2 text-sm" required />
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
              </div>
            ),
          },
          {
            id: "historique",
            label: "Historique",
            icone: "🕘",
            content: (
              <div className="card">
                {historique.length === 0 && <p className="text-sm text-stone-500">Aucun événement enregistré pour le moment.</p>}
                <ul className="space-y-3">
                  {historique.map((e) => (
                    <li key={e.id} className="border-b border-stone-100 pb-2 last:border-0">
                      <p className="text-xs text-stone-400">{formatDate(e.date)}</p>
                      <p className="text-sm font-medium">{e.titre}</p>
                      {e.description && <p className="text-sm text-stone-500">{e.description}</p>}
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
