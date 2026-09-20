import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import {
  creerCategorie,
  toggleCategorieActive,
  supprimerCategorie,
  creerCompetence,
  toggleCompetenceActive,
  supprimerCompetence,
} from "./actions";

export default async function CompetencesPage() {
  const user = await requireUser(ROLES_DIRECTION);

  const categories = await prisma.categorieCompetence.findMany({
    where: { garderieId: user.garderieId! },
    include: {
      competences: {
        include: { _count: { select: { acquisitions: true } } },
        orderBy: { ordreAffichage: "asc" },
      },
      _count: { select: { competences: true } },
    },
    orderBy: { ordre: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Compétences & progrès</h1>
        <p className="text-sm text-stone-500">
          Outil d&apos;observation et de valorisation des progrès — jamais un outil de diagnostic ou de
          classement. L&apos;absence d&apos;un badge signifie uniquement qu&apos;il n&apos;a pas encore été
          enregistré.
        </p>
      </div>

      <div className="card space-y-3">
        <p className="font-semibold">Nouvelle catégorie</p>
        <form action={creerCategorie} className="grid grid-cols-[80px_1fr_auto] gap-2">
          <input name="icone" placeholder="🧠" className="input-large text-center" maxLength={4} />
          <input name="nom" placeholder="Nom de la catégorie" className="input-large" required />
          <button className="btn-primary">Créer</button>
        </form>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">
                {cat.icone} {cat.nom}
              </p>
              <div className="flex items-center gap-2">
                <form action={toggleCategorieActive.bind(null, cat.id, !cat.actif)}>
                  <button className={`pill ${cat.actif ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                    {cat.actif ? "Active" : "Désactivée"}
                  </button>
                </form>
                {cat._count.competences === 0 && (
                  <form action={supprimerCategorie.bind(null, cat.id)}>
                    <button className="text-sm text-red-600">Supprimer</button>
                  </form>
                )}
              </div>
            </div>

            <ul className="space-y-1">
              {cat.competences.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm">
                  <span>
                    {c.icone} {c.nom}
                    {(c.ageIndicatifMoisMin || c.ageIndicatifMoisMax) && (
                      <span className="text-stone-400">
                        {" "}
                        · indicatif {c.ageIndicatifMoisMin ?? "?"}–{c.ageIndicatifMoisMax ?? "?"} mois
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <form action={toggleCompetenceActive.bind(null, c.id, !c.actif)}>
                      <button className={c.actif ? "text-green-700" : "text-stone-400"}>
                        {c.actif ? "Active" : "Désactivée"}
                      </button>
                    </form>
                    {c._count.acquisitions === 0 && (
                      <form action={supprimerCompetence.bind(null, c.id)}>
                        <button className="text-red-600">Supprimer</button>
                      </form>
                    )}
                  </span>
                </li>
              ))}
              {cat.competences.length === 0 && (
                <li className="text-sm text-stone-400">Aucune compétence dans cette catégorie.</li>
              )}
            </ul>

            <form action={creerCompetence} className="grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
              <input type="hidden" name="categorieId" value={cat.id} />
              <input name="icone" placeholder="Icône" className="input-large text-sm" maxLength={4} />
              <input name="nom" placeholder="Nom de la compétence" className="input-large text-sm" required />
              <input name="ageMin" type="number" placeholder="Âge indicatif min (mois)" className="input-large text-sm" />
              <input name="ageMax" type="number" placeholder="Âge indicatif max (mois)" className="input-large text-sm" />
              <button className="btn-secondary col-span-2 text-sm">Ajouter au catalogue</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
