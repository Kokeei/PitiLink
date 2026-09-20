"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function marquerNotificationsLues() {
  const session = await auth();
  if (!session?.user) return;
  await prisma.notification.updateMany({ where: { userId: session.user.id, lu: false }, data: { lu: true } });
  revalidatePath("/", "layout");
}

export async function changerMotDePasse(
  _prevState: { erreur: string | null; succes: boolean },
  formData: FormData
): Promise<{ erreur: string | null; succes: boolean }> {
  const session = await auth();
  if (!session?.user) return { erreur: "Non connecté.", succes: false };

  const ancien = formData.get("ancienMotDePasse") as string;
  const nouveau = formData.get("nouveauMotDePasse") as string;
  const confirmation = formData.get("confirmation") as string;

  if (!ancien || !nouveau || !confirmation) return { erreur: "Tous les champs sont obligatoires.", succes: false };
  if (nouveau.length < 8) return { erreur: "Le nouveau mot de passe doit faire au moins 8 caractères.", succes: false };
  if (nouveau !== confirmation) return { erreur: "La confirmation ne correspond pas au nouveau mot de passe.", succes: false };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const valide = await bcrypt.compare(ancien, user.passwordHash);
  if (!valide) return { erreur: "Mot de passe actuel incorrect.", succes: false };

  const passwordHash = await bcrypt.hash(nouveau, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { erreur: null, succes: true };
}
