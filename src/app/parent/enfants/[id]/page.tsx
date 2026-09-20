import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PARENT } from "@/lib/session";
import { getJournalDuJour } from "@/lib/data";
import { formatDate, formatHeure, debutJournee } from "@/lib/format";
import { ICONES_EVENEMENT, LIBELLES_EVENEMENT, parseJson, resumeEvenement } from "@/lib/journal";
import { getBadgesCompetences, getAcquisitionsEnfant } from "@/lib/competences";
import { EnTeteEnfant } from "@/components/fiche/EnTeteEnfant";
import { TuilesAujourdhui } from "@/components/fiche/TuilesAujourdhui";
import { BadgesCompetences } from "@/components/fiche/BadgesCompetences";
import { GaleriePhotos } from "@/components/fiche/GaleriePhotos";
import { ajouterMesureCroissance, transmettreInformation, ajouterContactUrgence } from "./actions";

export default async function FicheEnfantParentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date: dateParam } = await searchParams;
  const user = await requireUser(ROLES_PARENT);

  const lien = await prisma.parentEnfant.findFirst({ where: { enfantId: id, userId: user.id } });
  if (!lien) notFound();

  const enfant = await prisma.enfant.findUnique({
    where: { id },
    include: {
      groupe: true,
      infosImportantes: true,
      contactsUrgence: { orderBy: { ordrePriorite: "asc" } },
      personnesAutorisees: true,
      mesuresCroissance: { orderBy: { date: "desc" }, take: 10 },
      photos: { orderBy: { createdAt: "desc" } },
      affectations: { include: { professionnel: true } },
    },
  });
  if (!enfant) notFound();

  const dateAffichee = dateParam ? new Date(dateParam) : new Date();
  const journal = await getJournalDuJour(id, dateAffichee);
  const menu = await prisma.menuJour.findUnique({
    where: { garderieId_date: { garderieId: enfant.garderieId, date: debutJournee(dateAffichee) } },
  });

  const veille = new Date(dateAffichee);
  veille.setDate(veille.getDate() - 1);
  const lendemain = new Date(dateAffichee);
  lendemain.setDate(lendemain.getDate() + 1);
  const estAujourdhui = debutJournee(dateAffichee).getTime() === debutJournee().getTime();

  const petitMot = journal.find(
    (e) => e.type === "OBSERVATION" && e.commentaire && !e.commentaire.startsWith("[Transmission parent]")
  );

  const referente = enfant.affectations.find((a) => a.referente)?.professionnel;
  const [badges, acquisitions] = await Promise.all([
    getBadgesCompetences(id, enfant.garderieId),
    getAcquisitionsEnfant(id),
  ]);
  const derniereCompetence = acquisitions[0]?.competence;

  return (
    <div className="space-y-4">
      <EnTeteEnfant
        enfant={enfant}
        referente={referente ? `${referente.prenom} ${referente.nom}` : undefined}
        petitMot={estAujourdhui ? petitMot?.commentaire : undefined}
        derniereCompetence={derniereCompetence}
      />

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

      {/* Rapport / historique */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <a href={`?date=${veille.toISOString().slice(0, 10)}`} className="text-sm text-orange-600">
            ← Veille
          </a>
          <p className="font-semibold">{estAujourdhui ? "Aujourd'hui" : formatDate(dateAffichee)}</p>
          <a href={`?date=${lendemain.toISOString().slice(0, 10)}`} className="text-sm text-orange-600">
            Lendemain →
          </a>
        </div>

        {estAujourdhui && <TuilesAujourdhui journal={journal} />}

        {menu && (
          <div className="rounded-xl bg-orange-50 p-3 text-sm">
            <p className="font-medium text-orange-800">🍽️ Menu du jour</p>
            <p className="text-orange-900">
              {[menu.petitDejeuner, menu.dejeuner, menu.gouter].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}

        {petitMot && (
          <div className="rounded-xl bg-green-50 p-3 text-sm italic text-green-800">💬 « {petitMot.commentaire} »</div>
        )}

        {journal.length === 0 && <p className="text-sm text-stone-500">Aucun événement ce jour-là.</p>}

        <ul className="space-y-3">
          {journal.map((evt) => (
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
                {evt.commentaire && !evt.commentaire.startsWith("[Transmission parent]") && (
                  <p className="text-sm text-stone-500">{evt.commentaire}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Transmission vers la garderie */}
      <div className="card space-y-3">
        <p className="font-semibold">📣 À transmettre à la garderie</p>
        <form action={transmettreInformation.bind(null, id)} className="space-y-2">
          <textarea
            name="commentaire"
            rows={2}
            className="input-large"
            placeholder="Nuit difficile, dentition, humeur ce matin..."
          />
          <button className="btn-secondary w-full">Envoyer</button>
        </form>
      </div>

      {/* Croissance */}
      <div className="card space-y-3">
        <p className="font-semibold">📈 Croissance</p>
        <form action={ajouterMesureCroissance.bind(null, id)} className="grid grid-cols-3 gap-2">
          <input name="poidsKg" type="number" step="0.01" placeholder="Poids (kg)" className="input-large text-sm" />
          <input name="tailleCm" type="number" step="0.1" placeholder="Taille (cm)" className="input-large text-sm" />
          <input
            name="perimetreCranienCm"
            type="number"
            step="0.1"
            placeholder="PC (cm)"
            className="input-large text-sm"
          />
          <button className="btn-secondary col-span-3">Ajouter une mesure</button>
        </form>
        {enfant.mesuresCroissance.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-500">
                <th className="pb-1">Date</th>
                <th className="pb-1">Poids</th>
                <th className="pb-1">Taille</th>
                <th className="pb-1">PC</th>
              </tr>
            </thead>
            <tbody>
              {enfant.mesuresCroissance.map((m) => (
                <tr key={m.id} className="border-t border-stone-100">
                  <td className="py-1">{formatDate(m.date)}</td>
                  <td>{m.poidsKg ? `${m.poidsKg} kg` : "—"}</td>
                  <td>{m.tailleCm ? `${m.tailleCm} cm` : "—"}</td>
                  <td>{m.perimetreCranienCm ? `${m.perimetreCranienCm} cm` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <BadgesCompetences badges={badges} />

      {acquisitions.length > 0 && (
        <div className="card space-y-2">
          <p className="font-semibold">🌱 Historique des progrès</p>
          <ul className="space-y-3">
            {acquisitions.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="text-xl">{a.competence.icone ?? a.competence.categorie.icone}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {a.competence.nom} <span className="font-normal text-stone-400">— {formatDate(a.dateObservation)}</span>
                  </p>
                  {a.note && <p className="text-sm text-stone-500">« {a.note} »</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <GaleriePhotos photos={enfant.photos} />

      {/* Contacts d'urgence */}
      <div className="card space-y-3">
        <p className="font-semibold">📞 Contacts d&apos;urgence</p>
        <ul className="space-y-2 text-sm">
          {enfant.contactsUrgence.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
              <span>
                {c.prenom} {c.nom} <span className="text-stone-400">({c.lien})</span>
              </span>
              <a href={`tel:${c.telephone}`} className="font-medium text-orange-600">
                📱 {c.telephone}
              </a>
            </li>
          ))}
        </ul>
        <form action={ajouterContactUrgence.bind(null, id)} className="grid grid-cols-2 gap-2">
          <input name="prenom" placeholder="Prénom" className="input-large text-sm" required />
          <input name="nom" placeholder="Nom" className="input-large text-sm" required />
          <input name="lien" placeholder="Lien (ex: Tante)" className="input-large text-sm" required />
          <input name="telephone" placeholder="Téléphone" className="input-large text-sm" required />
          <button className="btn-secondary col-span-2">Ajouter un contact</button>
        </form>
      </div>

      {/* Personnes autorisées */}
      {enfant.personnesAutorisees.length > 0 && (
        <div className="card space-y-2">
          <p className="font-semibold">🪪 Personnes autorisées à récupérer l&apos;enfant</p>
          <ul className="space-y-1 text-sm">
            {enfant.personnesAutorisees.map((p) => (
              <li key={p.id}>
                {p.prenom} {p.nom} — {p.lien}{" "}
                {p.ponctuelle && <span className="pill bg-orange-100 text-orange-700 ml-1">Ponctuelle</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
