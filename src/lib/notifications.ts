import { prisma } from "@/lib/prisma";

export async function creerNotification(params: { userId: string; type: string; contenu: string; lien?: string }) {
  await prisma.notification.create({
    data: { userId: params.userId, type: params.type, contenu: params.contenu, lien: params.lien },
  });
}

export async function creerNotifications(userIds: string[], params: { type: string; contenu: string; lien?: string }) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type: params.type, contenu: params.contenu, lien: params.lien })),
  });
}

export async function creerNotificationsParents(enfantId: string, params: { type: string; contenu: string; lien?: string }) {
  const parents = await prisma.parentEnfant.findMany({ where: { enfantId }, select: { userId: true } });
  await creerNotifications(parents.map((p) => p.userId), params);
}
