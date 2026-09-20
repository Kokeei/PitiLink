"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import type { Role } from "@/generated/prisma/enums";

export async function creerProfessionnel(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const email = formData.get("email") as string;
  const telephone = (formData.get("telephone") as string) || undefined;
  const motDePasse = formData.get("motDePasse") as string;
  const role = (formData.get("role") as Role) || "PROFESSIONNEL";
  if (!prenom || !nom || !email || !motDePasse) return;

  const passwordHash = await bcrypt.hash(motDePasse, 10);

  await prisma.user.create({
    data: {
      prenom,
      nom,
      email,
      telephone,
      passwordHash,
      role,
      garderieId: user.garderieId!,
    },
  });

  revalidatePath("/direction/professionnels");
}
