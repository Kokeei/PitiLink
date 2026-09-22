import { commencerDelegation } from "./actions";
import { prisma } from "@/lib/prisma";
import { LIBELLES_ROLE, ROLE_PILL } from "@/lib/badges";
import { ROLES_DELEGABLES } from "@/lib/delegation";

const FILTRES = [
  { value: "", label: "Tous" },
  ...ROLES_DELEGABLES.map((role) => ({ value: role, label: LIBELLES_ROLE[role] })),
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; erreur?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const role = params.role && ROLES_DELEGABLES.includes(params.role as never) ? params.role : "";

  const users = await prisma.user.findMany({
    where: {
      role: role ? (role as never) : { in: ROLES_DELEGABLES },
      ...(q
        ? {
            OR: [
              { prenom: { contains: q, mode: "insensitive" } },
              { nom: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      garderie: {
        select: { nom: true },
      },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className="text-sm font-medium text-orange-600">Administration plateforme</p>
        <h1 className="text-2xl font-bold text-stone-900">Délégation de profil</h1>
        <p className="mt-1 text-sm text-stone-500">
          Connectez-vous temporairement comme un utilisateur pour vérifier son expérience et ses droits.
        </p>
      </div>

      {params.erreur === "cible_invalide" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Ce compte ne peut pas être utilisé pour une délégation.
        </div>
      )}

      <form className="card flex flex-col gap-3 md:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="🔍 Rechercher par prénom, nom ou email..."
          className="input-large flex-1"
        />
        <select name="role" defaultValue={role} className="input-large md:w-56">
          {FILTRES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <button className="btn-primary" type="submit">Rechercher</button>
      </form>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-stone-100 px-4 py-3">
          <p className="text-sm font-semibold text-stone-800">{users.length} compte(s)</p>
        </div>

        <div className="divide-y divide-stone-100">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-stone-900">{user.prenom} {user.nom}</p>
                  <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + (ROLE_PILL[user.role] ?? "bg-stone-100 text-stone-700")}>
                    {LIBELLES_ROLE[user.role] ?? user.role}
                  </span>
                </div>
                <p className="truncate text-sm text-stone-500">{user.email}</p>
                <p className="text-xs text-stone-400">{user.garderie?.nom ?? "Compte sans garderie"}</p>
              </div>

              <form action={commencerDelegation.bind(null, user.id)}>
                <button type="submit" className="btn-secondary whitespace-nowrap">
                  👤 Se connecter comme cette personne
                </button>
              </form>
            </div>
          ))}

          {users.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-stone-500">
              Aucun utilisateur ne correspond à votre recherche.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
