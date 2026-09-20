import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { getJournalDuJour, getPresenceDuJour, getActivitesRecentes } from "@/lib/data";
import { getSuggestionsCompetences, getCatalogueGroupe, getAcquisitionsEnfant, getBadgesCompetences } from "@/lib/competences";
import { formatDate, formatHeure } from "@/lib/format";
import { ICONES_EVENEMENT, LIBELLES_EVENEMENT, HUMEURS, parseJson, resumeEvenement } from "@/lib/journal";
import { JOURS_MENU, lundiDeLaSemaine, resoudreMenuEnfant, detecterConflitsAllergie, type EntreeMenu } from "@/lib/menus";
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
  ajouterBiberon,
  ajouterRepas,
  ajouterChange,
  demarrerSieste,
  terminerSieste,
  ajouterHumeur,
  ajouterActivite,
  ajouterBain,
  ajouterObservation,
  marquerPresence,
  enregistrerAcquisition,
  enregistrerAcquisitions,
  modifierPhotoEnfant,
  ajouterPhotoSouvenir,
} from "./actions";

const LIBELLES_TYPE_DOC: Record<string, string> = {
  CONTRAT: "Contrat",
  AUTORISATION: "Autorisation",
  ORDONNANCE: "Ordonnance",
  JUSTIFICATIF: "Justificatif",
  AUTRE: "Autre",
};

const ORDRE_CATEGORIES_DOCUMENT: CategorieDocument[] = ["ADMINISTRATIF", "SANTE", "AUTRES"];

export default async function FicheEnfantProPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(ROLES_PRO);
  const garderieId = user.garderieId!;

  const enfant = await prisma.enfant.findFirst({
    where: { id, garderieId },
    include: {
      groupe: true,
      infosImportantes: true,
      allergies: { include: { allergene: true } },
      parents: { include: { user: true } },
      affectations: { include: { professionnel: true } },
      photos: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      personnesAutorisees: true,
      contactsUrgence: { orderBy: { ordrePriorite: "asc" } },
      traitements: { orderBy: { dateFin: "desc" } },
      historique: { orderBy: { date: "desc" } },
    },
  });
  if (!enfant) notFound();

  const lundi = lundiDeLaSemaine();
  const [journal, presence, activites, suggestionsCompetences, catalogue, acquisitions, badges, activitesRecentes, semaineMenu, typesRepas, aliments] = await Promise.all([
    getJournalDuJour(id),
    getPresenceDuJour(id),
    prisma.activite.findMany({ where: { garderieId }, orderBy: { nom: "asc" } }),
    getSuggestionsCompetences(id, garderieId, enfant.dateNaissance),
    getCatalogueGroupe(garderieId),
    getAcquisitionsEnfant(id),
    getBadgesCompetences(id, garderieId),
    getActivitesRecentes(id),
    prisma.semaineMenu.findUnique({
      where: { garderieId_dateDebut: { garderieId, dateDebut: lundi } },
      include: { entrees: { include: { composants: { include: { aliment: true, remplaceAliment: true }, orderBy: { ordre: "asc" } } } } },
    }),
    prisma.typeRepas.findMany({ where: { garderieId, actif: true }, orderBy: { ordre: "asc" } }),
    prisma.aliment.findMany({ where: { garderieId }, include: { allergenes: { include: { allergene: true } } } }),
  ]);

  const siesteEnCours = [...journal].reverse().find((e) => e.type === "SIESTE" && !parseJson<{ heureFin?: string }>(e.donneesReelles)?.heureFin);
  const notes = journal.filter((e) => e.commentaire).slice(-5).reverse();

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
        retourHref="/pro/groupe"
        plusActions={
          enfant.autorisationPhotos === "AUTORISEE" ? (
            <form action={modifierPhotoEnfant.bind(null, id)} className="space-y-1">
              <p className="px-1 text-xs text-stone-500">Photo de profil</p>
              <input type="file" name="photo" accept="image/*" className="w-full px-1 text-xs" />
              <button className="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-stone-50">Enregistrer la photo</button>
            </form>
          ) : (
            <p className="px-1 text-xs text-stone-500">⚠️ Diffusion photo non autorisée</p>
          )
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
                  <CarteParents parents={enfant.parents} />
                  <div className="card space-y-2">
                    <p className="font-semibold">🪪 Personnes autorisées</p>
                    <ul className="space-y-1 text-sm">
                      {enfant.personnesAutorisees.map((p) => (
                        <li key={p.id}>
                          {p.prenom} {p.nom} <span className="text-stone-400">— {p.lien}</span>
                        </li>
                      ))}
                      {enfant.personnesAutorisees.length === 0 && <p className="text-stone-400">Aucune personne autorisée déclarée.</p>}
                    </ul>
                  </div>
                </div>
                <div className="card space-y-2">
                  <p className="font-semibold">🗓️ Accueil</p>
                  <p className="text-sm">👥 Groupe : {enfant.groupe?.nom ?? "Sans groupe"}</p>
                  {enfant.joursPresence.length > 0 && <p className="text-sm">📅 Jours de présence : {enfant.joursPresence.join(", ")}</p>}
                  {enfant.horaireHabituel && <p className="text-sm">🕐 Horaires : {enfant.horaireHabituel}</p>}
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
                  <div className="card space-y-2 border-2 border-red-100">
                    <p className="font-semibold text-red-800">🔴 Allergies</p>
                    {enfant.allergies.length === 0 ? (
                      <p className="text-sm text-stone-400">Aucune allergie déclarée.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {enfant.allergies.map((a) => (
                          <li key={a.id} className="font-medium text-red-800">{a.allergene.nom}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="card space-y-2">
                    <p className="font-semibold">💊 Traitement en cours</p>
                    {enCours.length === 0 ? (
                      <p className="text-sm text-emerald-700">🟢 Aucun traitement en cours</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {enCours.map((t) => (
                          <li key={t.id}>
                            <span className="font-medium">{t.nom}</span> — jusqu&apos;au {formatDate(t.dateFin)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="card space-y-2">
                    <p className="font-semibold">ℹ️ Informations importantes</p>
                    {enfant.infosImportantes.length === 0 ? (
                      <p className="text-sm text-stone-400">Aucune information particulière.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {enfant.infosImportantes.map((info) => (
                          <li key={info.id}>
                            <span className="font-medium">{info.titre}</span>
                            {info.description && <span className="text-stone-600"> — {info.description}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="card space-y-2">
                    <p className="font-semibold">📄 Documents santé</p>
                    {documentsGroupes.SANTE.length === 0 ? (
                      <p className="text-sm text-stone-400">Aucun document santé.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {documentsGroupes.SANTE.map((d) => (
                          <li key={d.id}>
                            <a href={d.url} target="_blank" rel="noreferrer" className="text-orange-700 hover:underline">
                              📄 {d.nom}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="card space-y-2 border-2 border-amber-200 bg-amber-50">
                  <p className="font-semibold text-amber-900">🚨 En cas d&apos;urgence</p>
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
              <div className="space-y-4">
                <div className="card flex flex-wrap gap-2">
                  <form action={marquerPresence.bind(null, id, "arrivee")} className="flex-1 min-w-[140px]">
                    <button className={presence?.heureArrivee ? "btn-done w-full text-sm" : "btn-secondary w-full text-sm"}>
                      🏠 Arrivée {presence?.heureArrivee ? `· ${formatHeure(presence.heureArrivee)}` : ""}
                    </button>
                  </form>
                  <form action={marquerPresence.bind(null, id, "depart")} className="flex-1 min-w-[140px]">
                    <button className={presence?.heureDepart ? "btn-done w-full text-sm" : "btn-secondary w-full text-sm"}>
                      👋 Départ {presence?.heureDepart ? `· ${formatHeure(presence.heureDepart)}` : ""}
                    </button>
                  </form>
                </div>

                <div className="card space-y-3">
                  <p className="font-semibold">🍼 Biberon</p>
                  <form action={ajouterBiberon.bind(null, id)} className="flex flex-wrap gap-2">
                    {[60, 90, 120, 150, 180].map((ml) => (
                      <button key={ml} name="quantite" value={ml} className="btn-secondary flex-1 min-w-[70px]">
                        {ml} ml
                      </button>
                    ))}
                  </form>
                </div>

                <div className="card space-y-3">
                  <p className="font-semibold">🍽️ Repas</p>
                  {["petit-déjeuner", "déjeuner", "goûter"].map((repas) => (
                    <form key={repas} action={ajouterRepas.bind(null, id)} className="space-y-2">
                      <input type="hidden" name="repas" value={repas} />
                      <p className="text-sm capitalize text-stone-500">{repas}</p>
                      <div className="flex flex-wrap gap-2">
                        {["Très bien", "Bien", "Peu", "Refusé"].map((q) => (
                          <button key={q} name="quantite" value={q} className="btn-secondary flex-1 min-w-[80px] text-sm">
                            {q}
                          </button>
                        ))}
                      </div>
                    </form>
                  ))}
                </div>

                <div className="card space-y-3">
                  <p className="font-semibold">🧷 Change</p>
                  <div className="flex flex-wrap gap-2">
                    <form action={ajouterChange.bind(null, id)} className="min-w-[100px] flex-1">
                      <input type="hidden" name="urine" value="true" />
                      <button className="btn-secondary w-full">💧 Urine</button>
                    </form>
                    <form action={ajouterChange.bind(null, id)} className="min-w-[100px] flex-1">
                      <input type="hidden" name="selle" value="true" />
                      <button className="btn-secondary w-full">💩 Selle</button>
                    </form>
                    <form action={ajouterChange.bind(null, id)} className="min-w-[100px] flex-1">
                      <input type="hidden" name="urine" value="true" />
                      <input type="hidden" name="selle" value="true" />
                      <button className="btn-secondary w-full">💧💩 Les deux</button>
                    </form>
                    <form action={ajouterChange.bind(null, id)} className="min-w-[100px] flex-1">
                      <button className="btn-secondary w-full">✓ Propre</button>
                    </form>
                  </div>
                </div>

                <div className="card space-y-3">
                  <p className="font-semibold">😴 Sieste</p>
                  {siesteEnCours ? (
                    <form action={terminerSieste.bind(null, id, siesteEnCours.id)}>
                      <button className="btn-primary w-full">☀️ Réveillé</button>
                    </form>
                  ) : (
                    <form action={demarrerSieste.bind(null, id)}>
                      <button className="btn-secondary w-full">😴 Démarrer la sieste</button>
                    </form>
                  )}
                </div>

                <div className="card space-y-3">
                  <p className="font-semibold">😊 Humeur</p>
                  <form action={ajouterHumeur.bind(null, id)} className="flex flex-wrap gap-2">
                    {HUMEURS.map((h) => (
                      <button key={h.valeur} name="humeur" value={h.valeur} className="btn-secondary flex-1 min-w-[70px] text-sm">
                        {h.icone} {h.libelle}
                      </button>
                    ))}
                  </form>
                </div>

                <div className="card space-y-3">
                  <p className="font-semibold">🎨 Activité</p>
                  <form action={ajouterActivite.bind(null, id)} className="flex flex-wrap gap-2">
                    {activites.map((a) => (
                      <button key={a.id} name="nom" value={a.nom} className="btn-secondary flex-1 min-w-[100px] text-sm">
                        {a.nom}
                      </button>
                    ))}
                  </form>
                </div>

                <div className="card space-y-3">
                  <p className="font-semibold">🛁 Bain</p>
                  <div className="flex gap-2">
                    <form action={ajouterBain.bind(null, id)} className="flex-1">
                      <input type="hidden" name="type" value="bain" />
                      <button className="btn-secondary w-full">🛁 Bain</button>
                    </form>
                    <form action={ajouterBain.bind(null, id)} className="flex-1">
                      <input type="hidden" name="type" value="douche" />
                      <button className="btn-secondary w-full">🚿 Douche</button>
                    </form>
                  </div>
                </div>

                <div className="card space-y-3">
                  <p className="font-semibold">📝 Observation</p>
                  {notes.length > 0 && (
                    <div className="space-y-1">
                      {notes.map((n) => (
                        <div key={n.id} className="rounded-lg bg-stone-50 px-3 py-2 text-sm">
                          <p>{n.commentaire}</p>
                          <p className="text-xs text-stone-400">{formatHeure(n.timestamp)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <form action={ajouterObservation.bind(null, id)} className="space-y-2">
                    <textarea name="commentaire" rows={2} className="input-large" placeholder="Observation libre..." />
                    <button className="btn-secondary w-full">Ajouter</button>
                  </form>
                </div>

                <div className="card">
                  <p className="mb-3 font-semibold">📅 Timeline de la journée</p>
                  {journal.length === 0 && <p className="text-sm text-stone-500">Aucun événement pour le moment.</p>}
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
                {semaineMenu?.statut === "BROUILLON" && <p className="card text-sm text-amber-700">Le menu de cette semaine n&apos;est pas encore publié.</p>}
                {semaineMenu?.statut === "PUBLIE" &&
                  JOURS_MENU.map((j, jour) => (
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
                              {resolu?.portee === "CATEGORIE" && <span className="pill bg-violet-100 text-[10px] text-violet-700">🏷️ Adapté au groupe</span>}
                              {resolu?.portee === "INDIVIDUEL" && <span className="pill bg-orange-100 text-[10px] text-orange-700">🔄 Menu personnalisé</span>}
                              {conflits.length > 0 && <span className="ml-1 block text-xs text-red-600">⚠️ Contient un allergène déclaré</span>}
                            </li>
                          );
                        })}
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
                  <p className="text-xs text-stone-400">Outil d&apos;observation : l&apos;absence d&apos;un badge signifie seulement qu&apos;il n&apos;a pas encore été enregistré.</p>

                  {suggestionsCompetences.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-stone-500">💡 Compétences pouvant être observées</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestionsCompetences.map((c) => (
                          <form key={c.id} action={enregistrerAcquisition.bind(null, id)}>
                            <input type="hidden" name="competenceId" value={c.id} />
                            <button className="btn-secondary text-sm">
                              {c.icone ?? c.categorie.icone} {c.nom}
                            </button>
                          </form>
                        ))}
                      </div>
                    </div>
                  )}

                  <form action={enregistrerAcquisitions.bind(null, id)} className="space-y-2">
                    <details className="rounded-xl border-2 border-stone-200">
                      <summary className="cursor-pointer select-none rounded-xl px-4 py-3 text-base font-medium">📋 Choisir dans le catalogue...</summary>
                      <div className="max-h-72 space-y-3 overflow-y-auto border-t border-stone-200 p-3">
                        {catalogue.map((cat) => (
                          <div key={cat.id}>
                            <p className="mb-1 text-xs font-semibold text-stone-500">
                              {cat.icone} {cat.nom}
                            </p>
                            {cat.competences.map((c) => (
                              <label key={c.id} className="flex items-center gap-2 py-1.5 text-sm">
                                <input type="checkbox" name="competenceIds" value={c.id} className="h-5 w-5" />
                                {c.icone} {c.nom}
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    </details>
                    <textarea name="note" rows={2} className="input-large" placeholder="Note (optionnel)" />
                    <button className="btn-primary w-full">✓ Valider les compétences sélectionnées</button>
                  </form>
                </div>

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

                {acquisitions.length > 0 && (
                  <div className="card space-y-2">
                    <p className="font-semibold">✓ Compétences observées</p>
                    <ul className="space-y-2">
                      {acquisitions.slice(0, 12).map((a) => (
                        <li key={a.id} className="text-sm">
                          <p>
                            <span className="text-lg">{a.competence.icone ?? a.competence.categorie.icone}</span> <span className="font-medium">{a.competence.nom}</span>{" "}
                            <span className="text-stone-400">— {formatDate(a.dateObservation)}</span>
                          </p>
                          {a.note && <p className="text-stone-500">« {a.note} »</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <GaleriePhotos photos={enfant.photos} ajouterAction={ajouterPhotoSouvenir.bind(null, id)} autorisation={enfant.autorisationPhotos} />
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
                    {documentsGroupes[cat].length === 0 ? (
                      <p className="text-sm text-stone-400">Aucun document.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {documentsGroupes[cat].map((d) => (
                          <li key={d.id}>
                            <a href={d.url} target="_blank" rel="noreferrer" className="text-orange-700 hover:underline">
                              📄 {d.nom} <span className="text-xs text-stone-400">— {LIBELLES_TYPE_DOC[d.type]} · {formatDate(d.createdAt)}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
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
