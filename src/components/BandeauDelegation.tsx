import { terminerDelegation } from "@/app/admin/actions";
import { getActiveDelegation } from "@/lib/delegation";
import { auth } from "@/auth";

export async function BandeauDelegation() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN_PLATEFORME") return null;

  const active = await getActiveDelegation(session.user.id);
  if (!active) return null;

  const cible = active.cible;

  return (
    <div className="sticky top-0 z-50 flex flex-col gap-2 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <p>
        🛡️ <strong>Délégation active</strong> — {cible.prenom} {cible.nom} · {cible.role}
      </p>
      <form action={terminerDelegation}>
        <button type="submit" className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-50">
          Quitter la délégation
        </button>
      </form>
    </div>
  );
}
