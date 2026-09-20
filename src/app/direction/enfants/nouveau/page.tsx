import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { AssistantAjoutEnfant } from "@/components/enfants/AssistantAjoutEnfant";
import { creerEnfant } from "../actions";

export default async function NouvelEnfantPage() {
  const user = await requireUser(ROLES_DIRECTION);
  const garderieId = user.garderieId!;

  const [groupes, allergenes] = await Promise.all([
    prisma.groupe.findMany({ where: { garderieId }, orderBy: { nom: "asc" } }),
    prisma.allergene.findMany({ where: { garderieId, actif: true }, orderBy: { nom: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/direction/enfants" className="text-sm text-orange-600">
          ← Retour à la liste
        </Link>
        <h1 className="mt-1 text-xl font-bold">Ajouter un enfant</h1>
        <p className="text-sm text-stone-500">Quelques informations essentielles suffisent pour créer la fiche.</p>
      </div>

      <AssistantAjoutEnfant action={creerEnfant} groupes={groupes} allergenes={allergenes} />
    </div>
  );
}
