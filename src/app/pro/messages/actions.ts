"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_PRO } from "@/lib/session";
import { envoyerMessage } from "@/lib/messagerie";

export async function envoyerMessagePro(enfantId: string, formData: FormData) {
  const user = await requireUser(ROLES_PRO);
  const enfant = await prisma.enfant.findFirst({ where: { id: enfantId, garderieId: user.garderieId! } });
  if (!enfant) return;

  // Une professionnelle ne peut écrire que sur le canal des enfants qui lui
  // sont actuellement affectés (direction/responsable, eux, voient tout).
  if (user.role === "PROFESSIONNEL") {
    const affectation = await prisma.affectation.findFirst({ where: { enfantId, professionnelId: user.id, actif: true } });
    if (!affectation) return;
  }

  await envoyerMessage(enfantId, user.id, (formData.get("contenu") as string) ?? "");
  revalidatePath(`/pro/messages/${enfantId}`);
  revalidatePath("/pro/messages");
}
