import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedDatabase } from "../src/lib/seedDatabase";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existant = await prisma.garderie.count();
  if (existant > 0) {
    console.log("La base contient déjà des données — seed ignoré (utiliser `prisma migrate reset` pour repartir de zéro).");
    return;
  }

  const resultat = await seedDatabase(prisma);

  console.log("Seed terminé.");
  console.log("Comptes de démonstration (mot de passe :", resultat.motDePasse, ")");
  console.log("  Direction     :", resultat.comptes.direction);
  console.log("  Responsable   :", resultat.comptes.responsable);
  console.log("  Professionnel :", resultat.comptes.professionnels.join(" / "));
  console.log("  Parent        :", resultat.comptes.parents.join(" / "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
