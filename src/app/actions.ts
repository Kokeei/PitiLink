"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function marquerNotificationsLues() {
  const session = await auth();
  if (!session?.user) return;
  await prisma.notification.updateMany({ where: { userId: session.user.id, lu: false }, data: { lu: true } });
  revalidatePath("/", "layout");
}
