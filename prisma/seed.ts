import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MOT_DE_PASSE_DEMO = "Password123!";

async function main() {
  const hash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 10);

  const garderie = await prisma.garderie.create({
    data: {
      nom: "Les Petits Loups",
      adresse: "12 rue des Lilas, 75000 Paris",
      telephone: "01 23 45 67 89",
      email: "contact@petitsloups.demo",
      horaires: "07h30 - 18h30",
    },
  });

  const groupeBebes = await prisma.groupe.create({
    data: {
      garderieId: garderie.id,
      nom: "Bébés",
      ageMinMois: 0,
      ageMaxMois: 18,
      capacite: 8,
      couleur: "#F6C7B6",
    },
  });

  const groupeMoyens = await prisma.groupe.create({
    data: {
      garderieId: garderie.id,
      nom: "Moyens",
      ageMinMois: 18,
      ageMaxMois: 36,
      capacite: 10,
      couleur: "#B6D7F6",
    },
  });

  const [, , ana, julie, maman, papa] = await Promise.all([
    prisma.user.create({
      data: {
        email: "direction.demo@pitilink.local",
        passwordHash: hash,
        prenom: "Claire",
        nom: "Martin",
        role: "DIRECTION",
        garderieId: garderie.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "responsable.demo@pitilink.local",
        passwordHash: hash,
        prenom: "Sophie",
        nom: "Bernard",
        role: "RESPONSABLE",
        garderieId: garderie.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "ana.demo@pitilink.local",
        passwordHash: hash,
        prenom: "Ana",
        nom: "Rousseau",
        role: "PROFESSIONNEL",
        garderieId: garderie.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "julie.demo@pitilink.local",
        passwordHash: hash,
        prenom: "Julie",
        nom: "Petit",
        role: "PROFESSIONNEL",
        garderieId: garderie.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "parent.demo@pitilink.local",
        passwordHash: hash,
        prenom: "Léa",
        nom: "Dubois",
        role: "PARENT",
        garderieId: garderie.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "papa.demo@pitilink.local",
        passwordHash: hash,
        prenom: "Rudy",
        nom: "Wong",
        role: "PARENT",
        garderieId: garderie.id,
      },
    }),
  ]);

  const kiivai = await prisma.enfant.create({
    data: {
      garderieId: garderie.id,
      groupeId: groupeBebes.id,
      prenom: "Kiivai",
      nom: "Wong",
      dateNaissance: new Date("2025-10-22"),
      dateInscription: new Date("2025-12-01"),
      dateDebutAccueil: new Date("2026-01-05"),
      statut: "ACTIF",
    },
  });

  const emma = await prisma.enfant.create({
    data: {
      garderieId: garderie.id,
      groupeId: groupeBebes.id,
      prenom: "Emma",
      nom: "Lefevre",
      dateNaissance: new Date("2025-05-14"),
      dateInscription: new Date("2025-08-01"),
      dateDebutAccueil: new Date("2025-09-01"),
      statut: "ACTIF",
    },
  });

  const noah = await prisma.enfant.create({
    data: {
      garderieId: garderie.id,
      groupeId: groupeMoyens.id,
      prenom: "Noah",
      nom: "Girard",
      dateNaissance: new Date("2023-11-02"),
      dateInscription: new Date("2024-01-01"),
      dateDebutAccueil: new Date("2024-02-01"),
      statut: "ACTIF",
    },
  });

  await prisma.parentEnfant.createMany({
    data: [
      { enfantId: kiivai.id, userId: maman.id, lien: "MERE" },
      { enfantId: kiivai.id, userId: papa.id, lien: "PERE" },
    ],
  });

  await prisma.contactUrgence.createMany({
    data: [
      {
        enfantId: kiivai.id,
        nom: "Wong",
        prenom: "Rudy",
        lien: "Père",
        telephone: "06 12 34 56 78",
        ordrePriorite: 1,
      },
      {
        enfantId: kiivai.id,
        nom: "Dubois",
        prenom: "Léa",
        lien: "Mère",
        telephone: "06 98 76 54 32",
        ordrePriorite: 2,
      },
    ],
  });

  await prisma.infoImportante.create({
    data: {
      enfantId: kiivai.id,
      type: "ALLERGIE",
      titre: "Allergie aux protéines de lait de vache",
      description: "Utiliser exclusivement le lait infantile fourni par les parents.",
      critique: true,
    },
  });

  await prisma.personneAutorisee.create({
    data: {
      enfantId: kiivai.id,
      nom: "Wong",
      prenom: "Mei",
      lien: "Grand-mère",
      telephone: "06 11 22 33 44",
    },
  });

  await prisma.affectation.createMany({
    data: [
      {
        enfantId: kiivai.id,
        professionnelId: ana.id,
        groupeId: groupeBebes.id,
        referente: true,
        joursSemaine: [1, 2, 3, 4, 5],
      },
      {
        enfantId: emma.id,
        professionnelId: ana.id,
        groupeId: groupeBebes.id,
        referente: true,
        joursSemaine: [1, 2, 3, 4, 5],
      },
      {
        enfantId: noah.id,
        professionnelId: julie.id,
        groupeId: groupeMoyens.id,
        referente: true,
        joursSemaine: [1, 2, 3, 4, 5],
      },
    ],
  });

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  await prisma.presence.createMany({
    data: [
      { enfantId: kiivai.id, date: aujourdhui, statut: "PRESENT", heureArrivee: new Date(new Date().setHours(7, 42)) },
      { enfantId: emma.id, date: aujourdhui, statut: "PRESENT", heureArrivee: new Date(new Date().setHours(8, 15)) },
      { enfantId: noah.id, date: aujourdhui, statut: "PREVU" },
    ],
  });

  await prisma.activite.createMany({
    data: [
      { garderieId: garderie.id, nom: "Peinture", categorie: "Créatif" },
      { garderieId: garderie.id, nom: "Lecture", categorie: "Éveil" },
      { garderieId: garderie.id, nom: "Motricité libre", categorie: "Motricité" },
      { garderieId: garderie.id, nom: "Extérieur / promenade", categorie: "Extérieur" },
      { garderieId: garderie.id, nom: "Éveil musical", categorie: "Éveil" },
    ],
  });

  await prisma.menuJour.create({
    data: {
      garderieId: garderie.id,
      date: aujourdhui,
      petitDejeuner: "Lait + compote",
      dejeuner: "Poulet + riz",
      gouter: "Yaourt + fruit",
    },
  });

  const heure = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  await prisma.journalEvenement.createMany({
    data: [
      {
        garderieId: garderie.id,
        enfantId: kiivai.id,
        type: "ARRIVEE",
        statut: "REALISE",
        timestamp: heure(7, 42),
        auteurId: ana.id,
      },
      {
        garderieId: garderie.id,
        enfantId: kiivai.id,
        type: "BIBERON",
        statut: "REALISE",
        timestamp: heure(8, 10),
        auteurId: ana.id,
        donneesPrevues: JSON.stringify({ quantiteMl: 150 }),
        donneesReelles: JSON.stringify({ quantiteMl: 120, type: "lait infantile" }),
      },
      {
        garderieId: garderie.id,
        enfantId: kiivai.id,
        type: "CHANGE",
        statut: "REALISE",
        timestamp: heure(9, 5),
        auteurId: ana.id,
        donneesReelles: JSON.stringify({ urine: true, selle: false }),
      },
      {
        garderieId: garderie.id,
        enfantId: kiivai.id,
        type: "SIESTE",
        statut: "REALISE",
        timestamp: heure(9, 30),
        auteurId: ana.id,
        donneesReelles: JSON.stringify({ heureDebut: "09:30", heureFin: "10:25", qualite: "bien" }),
      },
      {
        garderieId: garderie.id,
        enfantId: kiivai.id,
        type: "ACTIVITE",
        statut: "REALISE",
        timestamp: heure(10, 40),
        auteurId: ana.id,
        donneesReelles: JSON.stringify({ nom: "Peinture" }),
      },
      {
        garderieId: garderie.id,
        enfantId: kiivai.id,
        type: "HUMEUR",
        statut: "REALISE",
        timestamp: heure(11, 0),
        auteurId: ana.id,
        donneesReelles: JSON.stringify({ humeur: "TRES_BIEN" }),
      },
    ],
  });

  console.log("Seed terminé.");
  console.log("Comptes de démonstration (mot de passe :", MOT_DE_PASSE_DEMO, ")");
  console.log("  Direction     : direction.demo@pitilink.local");
  console.log("  Responsable   : responsable.demo@pitilink.local");
  console.log("  Professionnel : ana.demo@pitilink.local / julie.demo@pitilink.local");
  console.log("  Parent        : parent.demo@pitilink.local / papa.demo@pitilink.local");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
