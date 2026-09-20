"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, ROLES_DIRECTION } from "@/lib/session";
import { debutJournee } from "@/lib/format";

export async function enregistrerMenu(formData: FormData) {
  const user = await requireUser(ROLES_DIRECTION);
  const date = formData.get("date") as string;
  const petitDejeuner = formData.get("petitDejeuner") as string;
  const dejeuner = formData.get("dejeuner") as string;
  const gouter = formData.get("gouter") as string;
  if (!date) return;

  await prisma.menuJour.upsert({
    where: { garderieId_date: { garderieId: user.garderieId!, date: debutJournee(new Date(date)) } },
    create: {
      garderieId: user.garderieId!,
      date: debutJournee(new Date(date)),
      petitDejeuner,
      dejeuner,
      gouter,
    },
    update: { petitDejeuner, dejeuner, gouter },
  });

  revalidatePath("/direction/menus");
}
