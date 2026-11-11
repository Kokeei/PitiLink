"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { envoyerMessage } from "@/lib/messagerie";

export async function envoyerMessagePro(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_PRO);
  const enfant = await prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } });
  if (!enfant) return;

  await envoyerMessage(enfantId, user.id, (formData.get("contenu") as string) ?? "");
  revalidatePath(`/pro/messages/${enfantId}`);
  revalidatePath("/pro/messages");
}
