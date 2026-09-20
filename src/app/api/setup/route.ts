import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seedDatabase";

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
    return NextResponse.json({ statut: "deja_initialise", message: "La base contient déjà des données." });
  }

  const resultat = await seedDatabase(prisma);

  return NextResponse.json({
    statut: "ok",
    message: "Base de données initialisée avec les données de démonstration.",
    comptes: resultat.comptes,
    motDePasse: resultat.motDePasse,
  });
}
