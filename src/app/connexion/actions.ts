"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MOT_DE_PASSE_DEMO } from "@/lib/seedDatabase";

export async function connexionAction(
  _prevState: { erreur: string | null },
  formData: FormData
): Promise<{ erreur: string | null }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Vérification préalable pour un message clair ; le blocage réel (qui ne
  // peut pas être contourné même sans passer par cette action) a lieu dans
  // authorize() côté auth.ts.
  const utilisateur = await prisma.user.findUnique({ where: { email }, select: { verrouJusqua: true } });
  if (utilisateur?.verrouJusqua && utilisateur.verrouJusqua > new Date()) {
    const minutes = Math.ceil((utilisateur.verrouJusqua.getTime() - Date.now()) / 60000);
    return { erreur: `Trop de tentatives échouées. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.` };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return { erreur: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return { erreur: "Email ou mot de passe incorrect." };
    }
    throw error;
  }
}

// Liste fermée des comptes de démonstration/test : jamais d'email arbitraire,
// même si cette action était appelée avec une valeur différente de celles
// proposées par la page — c'est le seul garde-fou, le mot de passe n'étant
// lui-même jamais transmis par le client.
const COMPTES_ACCES_RAPIDE = new Set([
  "admin.demo@pitilink.local",
  "direction.demo@pitilink.local",
  "responsable.demo@pitilink.local",
  "ana.demo@pitilink.local",
  "julie.demo@pitilink.local",
  "parent.demo@pitilink.local",
  "papa.demo@pitilink.local",
  "test.parent@pitilink.local",
  "test.tatie@pitilink.local",
  "test.directrice@pitilink.local",
]);

export async function connexionRapideAction(email: string) {
  if (!COMPTES_ACCES_RAPIDE.has(email)) return;

  try {
    await signIn("credentials", { email, password: MOT_DE_PASSE_DEMO, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) return;
    throw error;
  }
}
