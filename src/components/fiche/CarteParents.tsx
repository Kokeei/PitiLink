import { LIBELLES_LIEN } from "@/lib/famille";
import type { LienFamilial } from "@/generated/prisma/enums";

function initiales(nom: string) {
  return nom
    .split(" ")
    .map((mot) => mot[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CarteParents({
  parents,
  ajouterAction,
}: {
  parents: {
    id: string;
    lien: LienFamilial;
    estContactUrgence: boolean;
    user: { prenom: string; nom: string; telephone: string | null; email: string };
  }[];
  ajouterAction?: React.ReactNode;
}) {
  const contactPrincipal = parents.find((p) => p.estContactUrgence);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold">👪 Parents / Contacts</p>
      </div>

      <div className="space-y-3">
        {parents.map((p) => (
          <div key={p.id} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
              {initiales(`${p.user.prenom} ${p.user.nom}`)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {p.user.prenom} {p.user.nom}
                <span className="pill bg-stone-100 text-xs text-stone-500">{LIBELLES_LIEN[p.lien]}</span>
                {p.estContactUrgence && <span className="pill bg-red-100 text-xs text-red-700">Contact principal</span>}
              </p>
              {p.user.telephone && (
                <a href={`tel:${p.user.telephone}`} className="block text-sm text-orange-600">
                  📱 {p.user.telephone}
                </a>
              )}
              <p className="truncate text-sm text-stone-500">✉️ {p.user.email}</p>
            </div>
          </div>
        ))}
        {parents.length === 0 && <p className="text-sm text-stone-500">Aucun parent lié.</p>}
      </div>

      {contactPrincipal && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          ☎️ Contact d&apos;urgence : {contactPrincipal.user.prenom} {contactPrincipal.user.nom}
          {contactPrincipal.user.telephone && ` — ${contactPrincipal.user.telephone}`}
        </div>
      )}

      {ajouterAction}
    </div>
  );
}
