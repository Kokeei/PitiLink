"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

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
