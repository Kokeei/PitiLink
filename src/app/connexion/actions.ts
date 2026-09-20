"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function connexionAction(
  _prevState: { erreur: string | null },
  formData: FormData
): Promise<{ erreur: string | null }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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
