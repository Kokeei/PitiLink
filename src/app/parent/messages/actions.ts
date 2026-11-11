"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PARENT } from "@/lib/session";
import { envoyerMessage } from "@/lib/messagerie";

export async function envoyerMessageParent(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_PARENT);
  const lien = await prisma.parentEnfant.findFirst({ where: { enfantId, userId: user.id } });
  if (!lien) return;

  await envoyerMessage(enfantId, user.id, (formData.get("contenu") as string) ?? "");
  revalidatePath(`/parent/messages/${enfantId}`);
  revalidatePath("/parent/messages");
}
