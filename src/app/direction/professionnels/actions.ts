"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";

export async function creerProfessionnel(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const email = formData.get("email") as string;
  const motDePasse = formData.get("motDePasse") as string;
  if (!prenom || !nom || !email || !motDePasse) return;

  const passwordHash = await bcrypt.hash(motDePasse, 10);

  await prisma.user.create({
    data: {
      prenom,
      nom,
      email,
      passwordHash,
      role: "PROFESSIONNEL",
      garderieId: user.garderieId!,
    },
  });

  revalidatePath("/direction/professionnels");
}
