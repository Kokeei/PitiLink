import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Réinitialise le mot de passe d'un utilisateur de la même garderie que
 * l'acteur (direction). Ne fait rien si l'utilisateur n'appartient pas à
 * cette garderie (protection IDOR) ou si le mot de passe est trop court.
 */
export async function reinitialiserMotDePasse(garderieId: string, userId: string, nouveauMotDePasse: string) {
  if (!nouveauMotDePasse || nouveauMotDePasse.length < 8) return;

  const cible = await prisma.user.findFirst({ where: { id: userId, garderieId } });
  if (!cible) return;

  const passwordHash = await bcrypt.hash(nouveauMotDePasse, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, tentativesEchoueesConnexion: 0, verrouJusqua: null },
  });
}
