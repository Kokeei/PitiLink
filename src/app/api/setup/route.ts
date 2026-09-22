import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { seedDatabase, MOT_DE_PASSE_DEMO } from "@/lib/seedDatabase";

/**
 * Endpoint de provisionnement à usage unique : applique les données de
 * démonstration sur une base fraîchement déployée (ex. après un premier
 * déploiement Vercel connecté à une base Neon vide).
 *
 * Protégé par SETUP_TOKEN (variable d'environnement) et idempotent : ne fait
 * rien si la base contient déjà une garderie. Peut rester en place sans
 * risque une fois utilisé.
 */
export async function GET(request: NextRequest) {
  const tokenAttendu = process.env.SETUP_TOKEN;
  if (!tokenAttendu) {
    return NextResponse.json(
      { erreur: "SETUP_TOKEN n'est pas configuré sur ce déploiement." },
      { status: 503 }
    );
  }

  const token = request.nextUrl.searchParams.get("token");
  if (token !== tokenAttendu) {
    return NextResponse.json({ erreur: "Token invalide." }, { status: 401 });
  }

  const existant = await prisma.garderie.count();
  if (existant > 0) {
    const adminExistant = await prisma.user.findUnique({
      where: { email: "admin.demo@pitilink.local" },
      select: { id: true },
    });

    if (adminExistant) {
      return NextResponse.json({ statut: "deja_initialise", message: "La base contient déjà des données et le compte administrateur existe." });
    }

    const passwordHash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 10);
    const admin = await prisma.user.create({
      data: {
        email: "admin.demo@pitilink.local",
        passwordHash,
        prenom: "Admin",
        nom: "PitiLink",
        role: "ADMIN_PLATEFORME",
        garderieId: null,
      },
      select: { email: true },
    });

    return NextResponse.json({
      statut: "admin_cree",
      message: "Compte administrateur plateforme créé.",
      compte: admin.email,
      motDePasse: MOT_DE_PASSE_DEMO,
    });
  }

  const resultat = await seedDatabase(prisma);

  return NextResponse.json({
    statut: "ok",
    message: "Base de données initialisée avec les données de démonstration.",
    comptes: resultat.comptes,
    motDePasse: resultat.motDePasse,
  });
}
