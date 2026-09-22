"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  DELEGATION_COOKIE,
  DUREE_DELEGATION_MS,
  ROLES_DELEGABLES,
  espacePourRole,
  getActiveDelegation,
} from "@/lib/delegation";

async function requireBaseAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN_PLATEFORME") {
    redirect("/connexion");
  }
  return session.user;
}

export async function commencerDelegation(cibleUserId: string) {
  const admin = await requireBaseAdmin();

  const cible = await prisma.user.findUnique({
    where: { id: cibleUserId },
    select: {
      id: true,
      prenom: true,
      nom: true,
      role: true,
      garderieId: true,
    },
  });

  if (!cible || !ROLES_DELEGABLES.includes(cible.role)) {
    redirect("/admin?erreur=cible_invalide");
  }

  const active = await getActiveDelegation(admin.id);
  if (active) {
    await prisma.delegation.update({
      where: { id: active.id },
      data: { termineeLe: new Date() },
    });
  }

  const delegation = await prisma.delegation.create({
    data: {
      adminId: admin.id,
      cibleUserId: cible.id,
      expireLe: new Date(Date.now() + DUREE_DELEGATION_MS),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(DELEGATION_COOKIE, delegation.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(DUREE_DELEGATION_MS / 1000),
  });

  redirect(espacePourRole(cible.role));
}

export async function terminerDelegation() {
  const admin = await requireBaseAdmin();
  const active = await getActiveDelegation(admin.id);

  if (active) {
    await prisma.delegation.update({
      where: { id: active.id },
      data: { termineeLe: new Date() },
    });
  }

  const cookieStore = await cookies();
  cookieStore.delete(DELEGATION_COOKIE);

  redirect("/admin");
}
