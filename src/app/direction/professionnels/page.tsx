import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { DonutChart } from "@/components/DonutChart";
import { creerProfessionnel, reinitialiserMotDePasseProfessionnel } from "./actions";
import { LIBELLES_ROLE, ROLE_PILL } from "@/lib/badges";
import type { Role } from "@/generated/prisma/enums";

export default async function ProfessionnelsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const user = await requireUser(ROLES_DIRECTION);
  const { q, role } = await searchParams;
  const garderieId = user.garderieId!;

  const professionnels = await prisma.user.findMany({
    where: {
      garderieId,
      role: { in: ["PROFESSIONNEL", "RESPONSABLE"] },
      ...(q ? { OR: [{ prenom: { contains: q, mode: "insensitive" } }, { nom: { contains: q, mode: "insensitive" } }] } : {}),
      ...(role ? { role: role as Role } : {}),
    },
    include: {
      affectations: {
        where: { actif: true },
        include: { groupe: true },
      },
    },
    orderBy: { prenom: "asc" },
  });

  const nbResponsables = professionnels.filter((p) => p.role === "RESPONSABLE").length;
  const nbEducateurs = professionnels.filter((p) => p.role === "PROFESSIONNEL").length;
  const nbAffectationsActives = professionnels.reduce((s, p) => s + p.affectations.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Professionnels</h1>
          <p className="text-sm text-stone-500">Équipe encadrante de la garderie.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-tile bg-orange-50">
          <p className="text-2xl font-bold text-orange-700">{professionnels.length}</p>
          <p className="text-xs text-stone-500">Membres de l&apos;équipe</p>
        </div>
        <div className="stat-tile bg-violet-50">
          <p className="text-2xl font-bold text-violet-700">{nbResponsables}</p>
          <p className="text-xs text-stone-500">Responsables</p>
        </div>
        <div className="stat-tile bg-blue-50">
          <p className="text-2xl font-bold text-blue-700">{nbEducateurs}</p>
          <p className="text-xs text-stone-500">Professionnels</p>
        </div>
        <div className="stat-tile bg-emerald-50">
          <p className="text-2xl font-bold text-emerald-700">{nbAffectationsActives}</p>
          <p className="text-xs text-stone-500">Affectations actives</p>
        </div>
      </div>

      <div className="card space-y-3">
        <p className="font-semibold">Ajouter un professionnel</p>
        <form action={creerProfessionnel} className="grid grid-cols-2 gap-2">
          <input name="prenom" placeholder="Prénom" className="input-large" required />
          <input name="nom" placeholder="Nom" className="input-large" required />
          <input name="email" type="email" placeholder="Email" className="input-large col-span-2" required />
          <input name="telephone" type="tel" placeholder="Téléphone" className="input-large" />
          <select name="role" className="input-large" defaultValue="PROFESSIONNEL">
            <option value="PROFESSIONNEL">Professionnel</option>
            <option value="RESPONSABLE">Responsable</option>
          </select>
          <input name="motDePasse" type="password" placeholder="Mot de passe initial" className="input-large col-span-2" required minLength={8} />
          <button className="btn-primary col-span-2">Créer le compte</button>
        </form>
      </div>

      <form className="card flex flex-wrap gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="🔍 Rechercher un professionnel..." className="input-large flex-1 min-w-[180px]" />
        <select name="role" defaultValue={role ?? ""} className="input-large w-auto">
          <option value="">Tous les rôles</option>
          <option value="PROFESSIONNEL">Professionnel</option>
          <option value="RESPONSABLE">Responsable</option>
        </select>
        <button className="btn-secondary">Filtrer</button>
        {(q || role) && (
          <Link href="/direction/professionnels" className="btn-secondary">
            Réinitialiser
          </Link>
        )}
      </form>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card overflow-x-auto lg:col-span-2">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-stone-500">
                <th className="pb-2">Nom</th>
                <th className="pb-2">Contact</th>
                <th className="pb-2">Rôle</th>
                <th className="pb-2">Groupes</th>
                <th className="pb-2">Enfants en charge</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {professionnels.map((p) => {
                const groupes = Array.from(new Map(p.affectations.filter((a) => a.groupe).map((a) => [a.groupeId, a.groupe!])).values());
                const nbEnfants = new Set(p.affectations.map((a) => a.enfantId)).size;
                return (
                  <tr key={p.id} className="border-t border-stone-100">
                    <td className="py-2 font-medium">
                      {p.prenom} {p.nom}
                    </td>
                    <td>
                      <p>{p.email}</p>
                      {p.telephone && <p className="text-xs text-stone-500">{p.telephone}</p>}
                    </td>
                    <td>
                      <span className={`pill ${ROLE_PILL[p.role] ?? "bg-stone-100"}`}>{LIBELLES_ROLE[p.role] ?? p.role}</span>
                    </td>
                    <td>
                      {groupes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {groupes.map((g) => (
                            <span key={g.id} className="pill bg-stone-100 text-xs">
                              {g.nom}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-400">Aucun</span>
                      )}
                    </td>
                    <td>{nbEnfants}</td>
                    <td>
                      <details className="relative">
                        <summary className="cursor-pointer select-none text-xs text-stone-500 hover:text-stone-700">
                          🔑 Mot de passe
                        </summary>
                        <form
                          action={reinitialiserMotDePasseProfessionnel.bind(null, p.id)}
                          className="absolute right-0 z-10 mt-1 flex w-56 flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-md"
                        >
                          <input
                            name="nouveauMotDePasse"
                            type="password"
                            placeholder="Nouveau mot de passe"
                            minLength={8}
                            required
                            className="input-large text-xs"
                          />
                          <button className="btn-secondary text-xs">Réinitialiser</button>
                        </form>
                      </details>
                    </td>
                  </tr>
                );
              })}
              {professionnels.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-stone-500">
                    Aucun professionnel ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <p className="mb-3 font-semibold">Répartition par rôle</p>
          <DonutChart
            centreValeur={professionnels.length}
            centreLabel="membres"
            segments={[
              { label: "Professionnels", value: nbEducateurs },
              { label: "Responsables", value: nbResponsables },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
