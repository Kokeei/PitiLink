import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { JOURS_MENU, lundiDeLaSemaine, resoudreMenuEnfant, detecterConflitsAllergie, type EntreeMenu, type ConflitAllergie } from "@/lib/menus";
import {
  creerSemaine,
  upsertMenuEntree,
  supprimerMenuEntree,
  copierJour,
  dupliquerSemaine,
  publierSemaine,
  archiverSemaine,
  remettreEnBrouillon,
  creerAllergene,
  basculerAllergene,
  creerTypeRepas,
  basculerTypeRepas,
  creerAliment,
  basculerAliment,
} from "./actions";
import type { PorteeMenu } from "@/generated/prisma/enums";

const STATUT_PILL: Record<string, string> = {
  BROUILLON: "bg-stone-200 text-stone-600",
  PUBLIE: "bg-emerald-100 text-emerald-700",
  ARCHIVE: "bg-stone-100 text-stone-400",
};
const STATUT_LABEL: Record<string, string> = { BROUILLON: "Brouillon", PUBLIE: "Publié", ARCHIVE: "Archivé" };
const PORTEE_BADGE: Record<string, string> = { GENERAL: "🌐 Général", CATEGORIE: "🏷️ Catégorie", INDIVIDUEL: "👶 Individuel" };

type SearchParams = { date?: string; vue?: string; groupe?: string; enfant?: string };

export default async function MenusPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser(ROLES_DIRECTION);
  const garderieId = user.garderieId!;
  const { date: dateParam, vue = "semaine", groupe: groupeParam, enfant: enfantParam } = await searchParams;

  const lundi = lundiDeLaSemaine(dateParam ? new Date(dateParam) : new Date());
  const lundiPrecedent = new Date(lundi);
  lundiPrecedent.setDate(lundiPrecedent.getDate() - 7);
  const lundiSuivant = new Date(lundi);
  lundiSuivant.setDate(lundiSuivant.getDate() + 7);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const [semaine, typesRepas, groupes, enfants, aliments, tousAliments, allergenes, semainesRecentes] = await Promise.all([
    prisma.semaineMenu.findUnique({
      where: { garderieId_dateDebut: { garderieId, dateDebut: lundi } },
      include: {
        entrees: {
          include: {
            composants: {
              include: { aliment: true, remplaceAliment: true },
              orderBy: { ordre: "asc" },
            },
          },
        },
      },
    }),
    prisma.typeRepas.findMany({ where: { garderieId, actif: true }, orderBy: { ordre: "asc" } }),
    prisma.groupe.findMany({ where: { garderieId }, orderBy: { nom: "asc" } }),
    prisma.enfant.findMany({
      where: { garderieId, statut: "ACTIF" },
      include: { allergies: { include: { allergene: true } } },
      orderBy: { prenom: "asc" },
    }),
    prisma.aliment.findMany({
      where: { garderieId, actif: true },
      include: { allergenes: { include: { allergene: true } } },
      orderBy: { nom: "asc" },
    }),
    // Non filtré par actif : un aliment désactivé peut toujours être
    // référencé par une entrée de menu existante — la détection de conflit
    // d'allergie doit continuer à le connaître, sinon un aliment retiré du
    // catalogue "disparaît" silencieusement des alertes.
    prisma.aliment.findMany({
      where: { garderieId },
      include: { allergenes: { include: { allergene: true } } },
    }),
    prisma.allergene.findMany({ where: { garderieId }, orderBy: { nom: "asc" } }),
    prisma.semaineMenu.findMany({ where: { garderieId }, orderBy: { dateDebut: "desc" }, take: 8 }),
  ]);

  const navSemaine = (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href={`?date=${iso(lundiPrecedent)}&vue=${vue}`} className="text-sm text-orange-600">
            ← Semaine précédente
          </Link>
          <p className="font-semibold">
            Semaine du {formatDate(lundi)} au {formatDate(new Date(lundi.getTime() + 4 * 86400000))}
          </p>
          <Link href={`?date=${iso(lundiSuivant)}&vue=${vue}`} className="text-sm text-orange-600">
            Semaine suivante →
          </Link>
        </div>
        {semaine && <span className={`pill ${STATUT_PILL[semaine.statut]}`}>{STATUT_LABEL[semaine.statut]}</span>}
      </div>

      {semaine && (
        <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
          {semaine.statut === "BROUILLON" && (
            <form action={publierSemaine.bind(null, semaine.id)}>
              <button className="btn-secondary text-xs">✓ Publier cette semaine</button>
            </form>
          )}
          {semaine.statut === "PUBLIE" && (
            <>
              <form action={remettreEnBrouillon.bind(null, semaine.id)}>
                <button className="text-xs text-stone-500">Repasser en brouillon</button>
              </form>
              <form action={archiverSemaine.bind(null, semaine.id)}>
                <button className="text-xs text-stone-500">Archiver</button>
              </form>
            </>
          )}
          <details className="relative ml-auto">
            <summary className="cursor-pointer select-none text-xs text-stone-500 hover:text-stone-700">
              📋 Dupliquer vers une autre semaine
            </summary>
            <form
              action={dupliquerSemaine.bind(null, semaine.id)}
              className="absolute right-0 z-10 mt-1 flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-md"
            >
              <input type="date" name="nouvelleDateDebut" required className="input-large text-xs" />
              <button className="btn-secondary shrink-0 text-xs">Dupliquer</button>
            </form>
          </details>
        </div>
      )}

      {semainesRecentes.length > 1 && (
        <div className="flex flex-wrap gap-1 border-t border-stone-100 pt-2">
          {semainesRecentes.map((s) => (
            <Link
              key={s.id}
              href={`?date=${iso(s.dateDebut)}&vue=${vue}`}
              className={`pill text-xs ${s.dateDebut.getTime() === lundi.getTime() ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-500"}`}
            >
              {formatDate(s.dateDebut)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const sousNav = (
    <div className="flex gap-1 overflow-x-auto border-b border-stone-200">
      {[
        { id: "semaine", label: "Semaine", icone: "📅" },
        { id: "categorie", label: "Par catégorie", icone: "🏷️" },
        { id: "enfant", label: "Par enfant", icone: "👶" },
        { id: "alertes", label: "Alertes", icone: "⚠️" },
      ].map((t) => (
        <Link
          key={t.id}
          href={`?date=${iso(lundi)}&vue=${t.id}`}
          className={t.id === vue ? "tab-item-active" : "tab-item"}
        >
          {t.icone} {t.label}
        </Link>
      ))}
    </div>
  );

  if (!semaine) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Menus</h1>
          <p className="text-sm text-stone-500">Menus généraux, par catégorie et individuels de la garderie.</p>
        </div>
        {navSemaine}
        <div className="card space-y-3 text-center">
          <p className="text-4xl">📅</p>
          <p className="font-semibold">Aucun menu pour cette semaine.</p>
          <p className="text-sm text-stone-500">Créez-la pour commencer à la remplir.</p>
          <form action={creerSemaine.bind(null, iso(lundi))}>
            <button className="btn-primary">Créer cette semaine</button>
          </form>
        </div>
      </div>
    );
  }

  const entreesResolues: EntreeMenu[] = semaine.entrees.map((e) => ({
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

  const allergenesParAliment = new Map(tousAliments.map((a) => [a.id, a.allergenes.map((al) => al.allergene)]));

  function trouverEntree(jour: number, typeRepasId: string, portee: PorteeMenu, groupeId: string | null, enfantId: string | null) {
    return semaine!.entrees.find(
      (e) => e.jourSemaine === jour && e.typeRepasId === typeRepasId && e.portee === portee && e.groupeId === groupeId && e.enfantId === enfantId
    );
  }

  function listeAliments(composants: { id: string; alimentNom: string; remplaceAlimentNom: string | null; motifRemplacement: string | null }[]) {
    if (composants.length === 0) return <p className="text-xs text-stone-400">Aucun menu défini.</p>;
    return (
      <ul className="space-y-1">
        {composants.map((c) => (
          <li key={c.id} className="text-sm">
            {c.remplaceAlimentNom ? (
              <span>
                <span className="text-stone-400 line-through">{c.remplaceAlimentNom}</span> → <span className="font-medium">{c.alimentNom}</span>
                {c.motifRemplacement && <span className="block text-xs text-stone-400">🔄 {c.motifRemplacement}</span>}
              </span>
            ) : (
              <span>{c.alimentNom}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  function formulaireEdition(params: {
    jour: number;
    typeRepasId: string;
    portee: PorteeMenu;
    groupeId: string | null;
    enfantId: string | null;
    alimentIdsParDefaut: string[];
    noteParDefaut: string | null;
    entreeId?: string;
    libelleAction: string;
  }) {
    return (
      <details className="relative">
        <summary className="cursor-pointer select-none text-xs text-orange-600 hover:text-orange-700">{params.libelleAction}</summary>
        <div className="absolute left-0 z-10 mt-1 w-72 max-w-[90vw] space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-md">
          <form action={upsertMenuEntree.bind(null, semaine!.id, params.jour, params.typeRepasId, params.portee, params.groupeId, params.enfantId)} className="space-y-2">
            {semaine!.statut === "PUBLIE" && (
              <label className="flex items-start gap-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                <input type="checkbox" name="confirmerModification" className="mt-0.5 h-4 w-4" required />
                Je confirme la modification de ce menu déjà publié
              </label>
            )}
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-stone-100 p-2">
              {aliments.map((a) => (
                <label key={a.id} className="flex items-center gap-2 py-0.5 text-sm">
                  <input type="checkbox" name="alimentIds" value={a.id} defaultChecked={params.alimentIdsParDefaut.includes(a.id)} className="h-4 w-4" />
                  {a.nom}
                  {a.allergenes.length > 0 && (
                    <span className="text-xs text-red-500">⚠️ {a.allergenes.map((al) => al.allergene.nom).join(", ")}</span>
                  )}
                </label>
              ))}
              {aliments.length === 0 && <p className="text-xs text-stone-400">Aucun aliment actif — créez-en dans les réglages.</p>}
            </div>
            <textarea name="note" placeholder="Note / motif (optionnel)" defaultValue={params.noteParDefaut ?? ""} rows={2} className="input-large text-xs" />
            <button className="btn-secondary w-full text-xs">Enregistrer</button>
          </form>
          {params.entreeId && (
            <form action={supprimerMenuEntree.bind(null, semaine!.id, params.entreeId)}>
              {semaine!.statut === "PUBLIE" && <input type="hidden" name="confirmerModification" value="on" />}
              <button className="text-xs text-red-600">Revenir au menu hérité</button>
            </form>
          )}
        </div>
      </details>
    );
  }

  let contenu: React.ReactNode = null;

  if (vue === "semaine") {
    const controleCopie = (jour: number) =>
      semaine!.statut !== "ARCHIVE" && (
        <details className="relative">
          <summary className="cursor-pointer select-none text-xs text-stone-400 hover:text-stone-600">⧉ Copier</summary>
          <form
            action={copierJour.bind(null, semaine!.id, jour)}
            className="absolute right-0 z-10 mt-1 flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-2 shadow-md"
          >
            <select name="jourCible" className="input-large w-auto text-xs" defaultValue="">
              <option value="" disabled>
                Copier vers...
              </option>
              {JOURS_MENU.map((j2, j2i) =>
                j2i === jour ? null : (
                  <option key={j2} value={j2i}>
                    {j2}
                  </option>
                )
              )}
            </select>
            <button className="text-xs text-orange-600">OK</button>
          </form>
        </details>
      );

    const celluleGenerale = (jour: number, typeRepasId: string) => {
      const entree = trouverEntree(jour, typeRepasId, "GENERAL", null, null);
      const composants =
        entree?.composants.map((c) => ({
          id: c.id,
          alimentNom: c.aliment.nom,
          remplaceAlimentNom: c.remplaceAliment?.nom ?? null,
          motifRemplacement: c.motifRemplacement,
        })) ?? [];
      return { entree, composants };
    };

    contenu = (
      <>
        <div className="card hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-stone-500">
                <th className="pb-2">Repas</th>
                {JOURS_MENU.map((j, jour) => (
                  <th key={j} className="pb-2">
                    <div className="flex items-center gap-2">
                      {j}
                      {controleCopie(jour)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {typesRepas.map((type) => (
                <tr key={type.id} className="border-t border-stone-100 align-top">
                  <td className="py-2 pr-3 font-medium">{type.nom}</td>
                  {JOURS_MENU.map((_, jour) => {
                    const { entree, composants } = celluleGenerale(jour, type.id);
                    return (
                      <td key={jour} className="py-2 pr-3">
                        {listeAliments(composants)}
                        {semaine!.statut !== "ARCHIVE" &&
                          formulaireEdition({
                            jour,
                            typeRepasId: type.id,
                            portee: "GENERAL",
                            groupeId: null,
                            enfantId: null,
                            alimentIdsParDefaut: entree?.composants.map((c) => c.alimentId) ?? [],
                            noteParDefaut: entree?.note ?? null,
                            entreeId: entree?.id,
                            libelleAction: entree ? "Modifier" : "+ Ajouter",
                          })}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {typesRepas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-stone-500">
                    Aucun type de repas configuré — voir les réglages ci-dessous.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {JOURS_MENU.map((j, jour) => (
            <div key={j} className="card space-y-2">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <p className="font-semibold">{j}</p>
                {controleCopie(jour)}
              </div>
              <div className="space-y-2 divide-y divide-stone-100">
                {typesRepas.map((type) => {
                  const { entree, composants } = celluleGenerale(jour, type.id);
                  return (
                    <div key={type.id} className="pt-2 first:pt-0">
                      <p className="mb-1 text-xs font-semibold text-stone-500">{type.nom}</p>
                      {listeAliments(composants)}
                      {semaine!.statut !== "ARCHIVE" &&
                        formulaireEdition({
                          jour,
                          typeRepasId: type.id,
                          portee: "GENERAL",
                          groupeId: null,
                          enfantId: null,
                          alimentIdsParDefaut: entree?.composants.map((c) => c.alimentId) ?? [],
                          noteParDefaut: entree?.note ?? null,
                          entreeId: entree?.id,
                          libelleAction: entree ? "Modifier" : "+ Ajouter",
                        })}
                    </div>
                  );
                })}
                {typesRepas.length === 0 && <p className="text-sm text-stone-500">Aucun type de repas configuré.</p>}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (vue === "categorie") {
    const groupeSelectionne = groupes.find((g) => g.id === groupeParam) ?? groupes[0];
    contenu = (
      <div className="space-y-4">
        <div className="card">
          <label className="mb-1 block text-sm text-stone-600">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {groupes.map((g) => (
              <Link
                key={g.id}
                href={`?date=${iso(lundi)}&vue=categorie&groupe=${g.id}`}
                className={`pill ${g.id === groupeSelectionne?.id ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-600"}`}
              >
                {g.nom}
              </Link>
            ))}
            {groupes.length === 0 && <p className="text-sm text-stone-500">Aucun groupe créé.</p>}
          </div>
        </div>

        {groupeSelectionne &&
          (() => {
            const celluleCategorie = (jour: number, typeRepasId: string) => {
              const entreeCategorie = trouverEntree(jour, typeRepasId, "CATEGORIE", groupeSelectionne.id, null);
              const entreeGeneral = trouverEntree(jour, typeRepasId, "GENERAL", null, null);
              const source = entreeCategorie ?? entreeGeneral;
              const composants =
                source?.composants.map((c) => ({
                  id: c.id,
                  alimentNom: c.aliment.nom,
                  remplaceAlimentNom: c.remplaceAliment?.nom ?? null,
                  motifRemplacement: c.motifRemplacement,
                })) ?? [];
              return { entreeCategorie, entreeGeneral, composants };
            };
            const badge = (entreeCategorie: unknown) => (
              <span className={`mb-1 inline-block pill text-[10px] ${entreeCategorie ? "bg-violet-100 text-violet-700" : "bg-stone-100 text-stone-500"}`}>
                {entreeCategorie ? PORTEE_BADGE.CATEGORIE : PORTEE_BADGE.GENERAL}
              </span>
            );
            return (
              <>
                <div className="card hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="text-left text-stone-500">
                        <th className="pb-2">Repas</th>
                        {JOURS_MENU.map((j) => (
                          <th key={j} className="pb-2">
                            {j}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {typesRepas.map((type) => (
                        <tr key={type.id} className="border-t border-stone-100 align-top">
                          <td className="py-2 pr-3 font-medium">{type.nom}</td>
                          {JOURS_MENU.map((_, jour) => {
                            const { entreeCategorie, entreeGeneral, composants } = celluleCategorie(jour, type.id);
                            return (
                              <td key={jour} className="py-2 pr-3">
                                {badge(entreeCategorie)}
                                {listeAliments(composants)}
                                {semaine!.statut !== "ARCHIVE" &&
                                  formulaireEdition({
                                    jour,
                                    typeRepasId: type.id,
                                    portee: "CATEGORIE",
                                    groupeId: groupeSelectionne.id,
                                    enfantId: null,
                                    alimentIdsParDefaut: (entreeCategorie ?? entreeGeneral)?.composants.map((c) => c.alimentId) ?? [],
                                    noteParDefaut: entreeCategorie?.note ?? null,
                                    entreeId: entreeCategorie?.id,
                                    libelleAction: entreeCategorie ? "Modifier" : "Personnaliser pour cette catégorie",
                                  })}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {JOURS_MENU.map((j, jour) => (
                    <div key={j} className="card space-y-2">
                      <p className="border-b border-stone-100 pb-2 font-semibold">{j}</p>
                      <div className="space-y-2 divide-y divide-stone-100">
                        {typesRepas.map((type) => {
                          const { entreeCategorie, entreeGeneral, composants } = celluleCategorie(jour, type.id);
                          return (
                            <div key={type.id} className="pt-2 first:pt-0">
                              <p className="mb-1 text-xs font-semibold text-stone-500">{type.nom}</p>
                              {badge(entreeCategorie)}
                              {listeAliments(composants)}
                              {semaine!.statut !== "ARCHIVE" &&
                                formulaireEdition({
                                  jour,
                                  typeRepasId: type.id,
                                  portee: "CATEGORIE",
                                  groupeId: groupeSelectionne.id,
                                  enfantId: null,
                                  alimentIdsParDefaut: (entreeCategorie ?? entreeGeneral)?.composants.map((c) => c.alimentId) ?? [],
                                  noteParDefaut: entreeCategorie?.note ?? null,
                                  entreeId: entreeCategorie?.id,
                                  libelleAction: entreeCategorie ? "Modifier" : "Personnaliser pour cette catégorie",
                                })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
      </div>
    );
  }

  if (vue === "enfant") {
    const enfantSelectionne = enfants.find((e) => e.id === enfantParam) ?? enfants[0];
    contenu = (
      <div className="space-y-4">
        <div className="card">
          <label className="mb-1 block text-sm text-stone-600">Enfant</label>
          <div className="flex flex-wrap gap-2">
            {enfants.map((e) => (
              <Link
                key={e.id}
                href={`?date=${iso(lundi)}&vue=enfant&enfant=${e.id}`}
                className={`pill ${e.id === enfantSelectionne?.id ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-600"}`}
              >
                {e.prenom} {e.allergies.length > 0 && "⚠️"}
              </Link>
            ))}
            {enfants.length === 0 && <p className="text-sm text-stone-500">Aucun enfant actif.</p>}
          </div>
        </div>

        {enfantSelectionne && (
          <>
            {enfantSelectionne.allergies.length > 0 && (
              <div className="card border-2 border-red-200 bg-red-50 text-sm text-red-800">
                ⚠️ Allergies déclarées : {enfantSelectionne.allergies.map((a) => a.allergene.nom).join(", ")}
              </div>
            )}
            {(() => {
              const celluleEnfant = (jour: number, typeRepasId: string) => {
                const resolu = resoudreMenuEnfant(
                  entreesResolues,
                  { id: enfantSelectionne.id, groupeId: enfantSelectionne.groupeId },
                  jour,
                  typeRepasId
                );
                const entreeIndividuelle = trouverEntree(jour, typeRepasId, "INDIVIDUEL", null, enfantSelectionne.id);
                const badgeClasse =
                  resolu?.portee === "INDIVIDUEL"
                    ? "bg-orange-100 text-orange-700"
                    : resolu?.portee === "CATEGORIE"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-stone-100 text-stone-500";
                return { resolu, entreeIndividuelle, badgeClasse };
              };
              return (
                <>
                  <div className="card hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="text-left text-stone-500">
                          <th className="pb-2">Repas</th>
                          {JOURS_MENU.map((j) => (
                            <th key={j} className="pb-2">
                              {j}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {typesRepas.map((type) => (
                          <tr key={type.id} className="border-t border-stone-100 align-top">
                            <td className="py-2 pr-3 font-medium">{type.nom}</td>
                            {JOURS_MENU.map((_, jour) => {
                              const { resolu, entreeIndividuelle, badgeClasse } = celluleEnfant(jour, type.id);
                              return (
                                <td key={jour} className="py-2 pr-3">
                                  {resolu && <span className={`mb-1 inline-block pill text-[10px] ${badgeClasse}`}>{PORTEE_BADGE[resolu.portee]}</span>}
                                  {listeAliments(resolu?.composants ?? [])}
                                  {semaine!.statut !== "ARCHIVE" &&
                                    formulaireEdition({
                                      jour,
                                      typeRepasId: type.id,
                                      portee: "INDIVIDUEL",
                                      groupeId: null,
                                      enfantId: enfantSelectionne.id,
                                      alimentIdsParDefaut: resolu?.composants.map((c) => c.alimentId) ?? [],
                                      noteParDefaut: entreeIndividuelle?.note ?? null,
                                      entreeId: entreeIndividuelle?.id,
                                      libelleAction: entreeIndividuelle ? "Modifier" : "Personnaliser pour cet enfant",
                                    })}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {JOURS_MENU.map((j, jour) => (
                      <div key={j} className="card space-y-2">
                        <p className="border-b border-stone-100 pb-2 font-semibold">{j}</p>
                        <div className="space-y-2 divide-y divide-stone-100">
                          {typesRepas.map((type) => {
                            const { resolu, entreeIndividuelle, badgeClasse } = celluleEnfant(jour, type.id);
                            return (
                              <div key={type.id} className="pt-2 first:pt-0">
                                <p className="mb-1 text-xs font-semibold text-stone-500">{type.nom}</p>
                                {resolu && <span className={`mb-1 inline-block pill text-[10px] ${badgeClasse}`}>{PORTEE_BADGE[resolu.portee]}</span>}
                                {listeAliments(resolu?.composants ?? [])}
                                {semaine!.statut !== "ARCHIVE" &&
                                  formulaireEdition({
                                    jour,
                                    typeRepasId: type.id,
                                    portee: "INDIVIDUEL",
                                    groupeId: null,
                                    enfantId: enfantSelectionne.id,
                                    alimentIdsParDefaut: resolu?.composants.map((c) => c.alimentId) ?? [],
                                    noteParDefaut: entreeIndividuelle?.note ?? null,
                                    entreeId: entreeIndividuelle?.id,
                                    libelleAction: entreeIndividuelle ? "Modifier" : "Personnaliser pour cet enfant",
                                  })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    );
  }

  if (vue === "alertes") {
    const conflitsParCellule: { jour: number; typeRepasNom: string; conflits: ConflitAllergie[] }[] = [];
    for (let jour = 0; jour < 5; jour++) {
      for (const type of typesRepas) {
        const conflitsCellule: ConflitAllergie[] = [];
        for (const enfant of enfants) {
          if (enfant.allergies.length === 0) continue;
          const resolu = resoudreMenuEnfant(entreesResolues, { id: enfant.id, groupeId: enfant.groupeId }, jour, type.id);
          if (!resolu) continue;
          const composants = resolu.composants.map((c) => ({
            alimentId: c.alimentId,
            alimentNom: c.alimentNom,
            allergeneIds: (allergenesParAliment.get(c.alimentId) ?? []).map((a) => a.id),
          }));
          conflitsCellule.push(
            ...detecterConflitsAllergie(composants, [
              {
                id: enfant.id,
                nomComplet: `${enfant.prenom} ${enfant.nom}`,
                allergies: enfant.allergies.map((a) => ({ allergeneId: a.allergeneId, allergeneNom: a.allergene.nom })),
              },
            ])
          );
        }
        if (conflitsCellule.length > 0) conflitsParCellule.push({ jour, typeRepasNom: type.nom, conflits: conflitsCellule });
      }
    }

    contenu = (
      <div className="space-y-3">
        {conflitsParCellule.length === 0 ? (
          <div className="card space-y-2 border-2 border-emerald-200 bg-emerald-50 text-center">
            <p className="text-3xl">🟢</p>
            <p className="font-semibold text-emerald-800">Aucun conflit alimentaire détecté cette semaine.</p>
          </div>
        ) : (
          conflitsParCellule.map(({ jour, typeRepasNom, conflits }) => (
            <div key={`${jour}-${typeRepasNom}`} className="card space-y-2 border-2 border-red-200 bg-red-50">
              <p className="font-semibold text-red-800">
                🔴 {JOURS_MENU[jour]} — {typeRepasNom}
              </p>
              <ul className="space-y-1 text-sm text-red-900">
                {conflits.map((c, i) => (
                  <li key={i}>
                    <span className="font-medium">{c.enfantNom}</span> : allergie à <strong>{c.allergeneNom}</strong>, présent dans « {c.alimentNom} »
                  </li>
                ))}
              </ul>
              <Link href={`?date=${iso(lundi)}&vue=enfant&enfant=${conflits[0].enfantId}`} className="text-xs text-red-700 underline">
                Voir le menu de cet enfant pour le remplacer →
              </Link>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Menus</h1>
        <p className="text-sm text-stone-500">Menus généraux, par catégorie et individuels de la garderie.</p>
      </div>

      {navSemaine}
      {sousNav}
      {contenu}

      <details className="card">
        <summary className="cursor-pointer select-none font-semibold">⚙️ Réglages : aliments, allergènes, types de repas</summary>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-stone-600">Types de repas</p>
            <ul className="space-y-1 text-sm">
              {typesRepas.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-2 py-1">
                  {t.nom}
                  <form action={basculerTypeRepas.bind(null, t.id)}>
                    <button className="text-xs text-stone-500">{t.actif ? "Désactiver" : "Activer"}</button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={creerTypeRepas} className="flex gap-1">
              <input name="nom" placeholder="Nouveau type (ex. Collation)" className="input-large text-xs" required />
              <button className="btn-secondary shrink-0 text-xs">+</button>
            </form>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-stone-600">Allergènes</p>
            <ul className="space-y-1 text-sm">
              {allergenes.map((a) => (
                <li key={a.id} className={`flex items-center justify-between rounded-lg px-2 py-1 ${a.actif ? "bg-stone-50" : "bg-stone-100 text-stone-400"}`}>
                  {a.nom}
                  <form action={basculerAllergene.bind(null, a.id)}>
                    <button className="text-xs text-stone-500">{a.actif ? "Désactiver" : "Activer"}</button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={creerAllergene} className="flex gap-1">
              <input name="nom" placeholder="Nouvel allergène" className="input-large text-xs" required />
              <button className="btn-secondary shrink-0 text-xs">+</button>
            </form>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-stone-600">Aliments ({aliments.length} actifs)</p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
              {aliments.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-2 py-1">
                  <span>
                    {a.nom}
                    {a.allergenes.length > 0 && <span className="ml-1 text-xs text-red-500">⚠️</span>}
                  </span>
                  <form action={basculerAliment.bind(null, a.id)}>
                    <button className="text-xs text-stone-500">Désactiver</button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={creerAliment} className="space-y-1">
              <input name="nom" placeholder="Nom de l'aliment" className="input-large text-xs" required />
              <input name="categorieAlimentaire" placeholder="Catégorie (optionnel)" className="input-large text-xs" />
              <div className="max-h-24 overflow-y-auto rounded-lg border border-stone-100 p-1">
                {allergenes.map((a) => (
                  <label key={a.id} className="flex items-center gap-1 text-xs">
                    <input type="checkbox" name="allergeneIds" value={a.id} className="h-3 w-3" /> {a.nom}
                  </label>
                ))}
              </div>
              <button className="btn-secondary w-full text-xs">Ajouter l&apos;aliment</button>
            </form>
          </div>
        </div>
      </details>
    </div>
  );
}
