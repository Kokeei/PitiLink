import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { JOURS_MENU, lundiDeLaSemaine, resoudreMenuEnfant, detecterConflitsAllergie, type EntreeMenu, type ConflitAllergie } from "@/lib/menus";

const STATUT_LABEL: Record<string, string> = { BROUILLON: "Brouillon (non publié)", PUBLIE: "Publié", ARCHIVE: "Archivé" };
const PORTEE_BADGE: Record<string, string> = { GENERAL: "🌐 Général", CATEGORIE: "🏷️ Catégorie", INDIVIDUEL: "👶 Individuel" };

type SearchParams = { date?: string; vue?: string; enfant?: string };

export default async function MenusProPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser(ROLES_PRO);
  const garderieId = user.garderieId!;
  const { date: dateParam, vue = "enfant", enfant: enfantParam } = await searchParams;

  const lundi = lundiDeLaSemaine(dateParam ? new Date(dateParam) : new Date());
  const lundiPrecedent = new Date(lundi);
  lundiPrecedent.setDate(lundiPrecedent.getDate() - 7);
  const lundiSuivant = new Date(lundi);
  lundiSuivant.setDate(lundiSuivant.getDate() + 7);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const [semaine, typesRepas, enfants, aliments] = await Promise.all([
    prisma.semaineMenu.findUnique({
      where: { garderieId_dateDebut: { garderieId, dateDebut: lundi } },
      include: { entrees: { include: { composants: { include: { aliment: true, remplaceAliment: true }, orderBy: { ordre: "asc" } } } } },
    }),
    prisma.typeRepas.findMany({ where: { garderieId, actif: true }, orderBy: { ordre: "asc" } }),
    prisma.enfant.findMany({
      where: { garderieId, statut: "ACTIF" },
      include: { allergies: { include: { allergene: true } } },
      orderBy: { prenom: "asc" },
    }),
    prisma.aliment.findMany({ where: { garderieId }, include: { allergenes: { include: { allergene: true } } } }),
  ]);

  const navSemaine = (
    <div className="card flex items-center justify-between">
      <Link href={`?date=${iso(lundiPrecedent)}&vue=${vue}`} className="text-sm text-orange-600">
        ← Semaine précédente
      </Link>
      <div className="text-center">
        <p className="font-semibold">
          Semaine du {formatDate(lundi)} au {formatDate(new Date(lundi.getTime() + 4 * 86400000))}
        </p>
        {semaine && <p className="text-xs text-stone-400">{STATUT_LABEL[semaine.statut]}</p>}
      </div>
      <Link href={`?date=${iso(lundiSuivant)}&vue=${vue}`} className="text-sm text-orange-600">
        Semaine suivante →
      </Link>
    </div>
  );

  const sousNav = (
    <div className="flex gap-1 overflow-x-auto border-b border-stone-200">
      {[
        { id: "enfant", label: "Par enfant", icone: "👶" },
        { id: "semaine", label: "Menu général", icone: "📅" },
        { id: "alertes", label: "Alertes", icone: "⚠️" },
      ].map((t) => (
        <Link key={t.id} href={`?date=${iso(lundi)}&vue=${t.id}`} className={t.id === vue ? "tab-item-active" : "tab-item"}>
          {t.icone} {t.label}
        </Link>
      ))}
    </div>
  );

  if (!semaine || semaine.statut === "BROUILLON") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Menus</h1>
        {navSemaine}
        <p className="card text-center text-sm text-stone-500">
          {semaine ? "Le menu de cette semaine n'est pas encore publié par la direction." : "Aucun menu pour cette semaine."}
        </p>
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

  let contenu: React.ReactNode = null;

  if (vue === "enfant") {
    const enfantSelectionne = enfants.find((e) => e.id === enfantParam) ?? enfants[0];
    contenu = (
      <div className="space-y-4">
        <div className="card">
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
                const resolu = resoudreMenuEnfant(entreesResolues, { id: enfantSelectionne.id, groupeId: enfantSelectionne.groupeId }, jour, typeRepasId);
                const badgeClasse =
                  resolu?.portee === "INDIVIDUEL"
                    ? "bg-orange-100 text-orange-700"
                    : resolu?.portee === "CATEGORIE"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-stone-100 text-stone-500";
                return { resolu, badgeClasse };
              };
              return (
                <>
                  <div className="card hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[600px] text-sm">
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
                              const { resolu, badgeClasse } = celluleEnfant(jour, type.id);
                              return (
                                <td key={jour} className="py-2 pr-3">
                                  {resolu && <span className={`mb-1 inline-block pill text-[10px] ${badgeClasse}`}>{PORTEE_BADGE[resolu.portee]}</span>}
                                  {listeAliments(resolu?.composants ?? [])}
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
                            const { resolu, badgeClasse } = celluleEnfant(jour, type.id);
                            return (
                              <div key={type.id} className="pt-2 first:pt-0">
                                <p className="mb-1 text-xs font-semibold text-stone-500">{type.nom}</p>
                                {resolu && <span className={`mb-1 inline-block pill text-[10px] ${badgeClasse}`}>{PORTEE_BADGE[resolu.portee]}</span>}
                                {listeAliments(resolu?.composants ?? [])}
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

  if (vue === "semaine") {
    const celluleGenerale = (jour: number, typeRepasId: string) => {
      const entree = semaine.entrees.find((e) => e.jourSemaine === jour && e.typeRepasId === typeRepasId && e.portee === "GENERAL");
      return (
        entree?.composants.map((c) => ({
          id: c.id,
          alimentNom: c.aliment.nom,
          remplaceAlimentNom: c.remplaceAliment?.nom ?? null,
          motifRemplacement: c.motifRemplacement,
        })) ?? []
      );
    };
    contenu = (
      <>
        <div className="card hidden overflow-x-auto md:block">
          <table className="w-full min-w-[600px] text-sm">
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
                  {JOURS_MENU.map((_, jour) => (
                    <td key={jour} className="py-2 pr-3">
                      {listeAliments(celluleGenerale(jour, type.id))}
                    </td>
                  ))}
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
                {typesRepas.map((type) => (
                  <div key={type.id} className="pt-2 first:pt-0">
                    <p className="mb-1 text-xs font-semibold text-stone-500">{type.nom}</p>
                    {listeAliments(celluleGenerale(jour, type.id))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (vue === "alertes") {
    const allergenesParAliment = new Map(aliments.map((a) => [a.id, a.allergenes.map((al) => al.allergene)]));
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
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Menus</h1>
      {navSemaine}
      {sousNav}
      {contenu}
    </div>
  );
}
