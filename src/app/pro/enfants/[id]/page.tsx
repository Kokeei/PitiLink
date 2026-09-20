import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { getJournalDuJour, getPresenceDuJour } from "@/lib/data";
import { calculerAge, formatHeure } from "@/lib/format";
import { ICONES_EVENEMENT, LIBELLES_EVENEMENT, HUMEURS, parseJson, resumeEvenement } from "@/lib/journal";
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
} from "./actions";

export default async function FicheEnfantProPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(ROLES_PRO);

  const enfant = await prisma.enfant.findFirst({
    where: { id, garderieId: user.garderieId! },
    include: { groupe: true, infosImportantes: true },
  });
  if (!enfant) notFound();

  const [journal, presence, activites] = await Promise.all([
    getJournalDuJour(id),
    getPresenceDuJour(id),
    prisma.activite.findMany({ where: { garderieId: user.garderieId! }, orderBy: { nom: "asc" } }),
  ]);

  const siesteEnCours = [...journal]
    .reverse()
    .find((e) => e.type === "SIESTE" && !parseJson<{ heureFin?: string }>(e.donneesReelles)?.heureFin);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
            👶
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{enfant.prenom} {enfant.nom}</h1>
            <p className="text-sm text-stone-500">
              🎂 {calculerAge(enfant.dateNaissance)} · {enfant.groupe?.nom ?? "Sans groupe"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <form action={marquerPresence.bind(null, id, "arrivee")} className="flex-1">
            <button className={presence?.heureArrivee ? "btn-done w-full" : "btn-secondary w-full"}>
              🏠 Arrivée {presence?.heureArrivee ? `· ${formatHeure(presence.heureArrivee)}` : ""}
            </button>
          </form>
          <form action={marquerPresence.bind(null, id, "depart")} className="flex-1">
            <button className={presence?.heureDepart ? "btn-done w-full" : "btn-secondary w-full"}>
              👋 Départ {presence?.heureDepart ? `· ${formatHeure(presence.heureDepart)}` : ""}
            </button>
          </form>
        </div>
      </div>

      {enfant.infosImportantes.length > 0 && (
        <div className="card border-2 border-amber-300 bg-amber-50">
          <p className="font-semibold text-amber-800">⚠️ Informations importantes</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {enfant.infosImportantes.map((info) => (
              <li key={info.id}>
                <span className="font-medium">{info.titre}</span>
                {info.description && <span> — {info.description}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions rapides */}
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
            <p className="text-sm text-stone-500 capitalize">{repas}</p>
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
          <form action={ajouterChange.bind(null, id)} className="flex-1 min-w-[100px]">
            <input type="hidden" name="urine" value="true" />
            <button className="btn-secondary w-full">💧 Urine</button>
          </form>
          <form action={ajouterChange.bind(null, id)} className="flex-1 min-w-[100px]">
            <input type="hidden" name="selle" value="true" />
            <button className="btn-secondary w-full">💩 Selle</button>
          </form>
          <form action={ajouterChange.bind(null, id)} className="flex-1 min-w-[100px]">
            <input type="hidden" name="urine" value="true" />
            <input type="hidden" name="selle" value="true" />
            <button className="btn-secondary w-full">💧💩 Les deux</button>
          </form>
          <form action={ajouterChange.bind(null, id)} className="flex-1 min-w-[100px]">
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
        <form action={ajouterObservation.bind(null, id)} className="space-y-2">
          <textarea name="commentaire" rows={2} className="input-large" placeholder="Observation libre..." />
          <button className="btn-secondary w-full">Ajouter</button>
        </form>
      </div>

      {/* Timeline */}
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
                  {LIBELLES_EVENEMENT[evt.type]}
                  {" "}
                  <span className="font-normal text-stone-600">
                    {resumeEvenement(evt.type, parseJson(evt.donneesReelles))}
                  </span>
                </p>
                {evt.commentaire && <p className="text-sm text-stone-500">{evt.commentaire}</p>}
                {evt.auteur && (
                  <p className="text-xs text-stone-400">par {evt.auteur.prenom}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
