import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";
import { lundiDeLaSemaine } from "@/lib/menus";

export const MOT_DE_PASSE_DEMO = "Password123!";

/**
 * Peuple une base vide avec la garderie de démonstration (données du MVP).
 * Idempotence : à appeler uniquement si la base est vide (voir la garde dans
 * /api/setup et prisma/seed.ts).
 */
export async function seedDatabase(prisma: PrismaClient) {
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

  const admin = await prisma.user.create({
    data: {
      email: "admin.demo@pitilink.local",
      passwordHash: hash,
      prenom: "Admin",
      nom: "PitiLink",
      role: "ADMIN_PLATEFORME",
      garderieId: null,
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
      sexe: "GARCON",
      dateInscription: new Date("2025-12-01"),
      dateDebutAccueil: new Date("2026-01-05"),
      statut: "ACTIF",
      autorisationPhotos: "AUTORISEE",
      joursPresence: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
      horaireHabituel: "07h30 - 18h30",
      medecinNom: "Dr Teahui Robin",
      medecinTelephone: "87 65 43 21",
    },
  });

  const emma = await prisma.enfant.create({
    data: {
      garderieId: garderie.id,
      groupeId: groupeBebes.id,
      prenom: "Emma",
      nom: "Lefevre",
      dateNaissance: new Date("2025-05-14"),
      sexe: "FILLE",
      dateInscription: new Date("2025-08-01"),
      dateDebutAccueil: new Date("2025-09-01"),
      statut: "ACTIF",
      autorisationPhotos: "AUTORISEE",
      joursPresence: ["Lundi", "Mardi", "Jeudi", "Vendredi"],
      horaireHabituel: "08h00 - 17h30",
    },
  });

  const noah = await prisma.enfant.create({
    data: {
      garderieId: garderie.id,
      groupeId: groupeMoyens.id,
      prenom: "Noah",
      nom: "Girard",
      dateNaissance: new Date("2023-11-02"),
      sexe: "GARCON",
      dateInscription: new Date("2024-01-01"),
      dateDebutAccueil: new Date("2024-02-01"),
      statut: "ACTIF",
      joursPresence: ["Lundi", "Mercredi", "Vendredi"],
      horaireHabituel: "09h00 - 16h00",
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

  // Un traitement déjà terminé (illustre le passage automatique vers
  // l'historique une fois la date de fin dépassée) et l'historique associé.
  await prisma.traitement.create({
    data: {
      enfantId: kiivai.id,
      nom: "Sirop antibiotique",
      dateDebut: new Date(Date.now() - 14 * 86400000),
      dateFin: new Date(Date.now() - 7 * 86400000),
      note: "3 prises par jour, prescrit après une otite",
    },
  });

  await prisma.historiqueEnfant.createMany({
    data: [
      { enfantId: kiivai.id, date: new Date(Date.now() - 15 * 86400000), titre: "Allergie ajoutée : Protéines de lait de vache" },
      { enfantId: kiivai.id, date: new Date(Date.now() - 5 * 86400000), titre: "Document ajouté : Certificat médical" },
    ],
  });

  // ---- Module Menus : allergènes, aliments, types de repas, menus --------

  const [allergeneLait, allergeneGluten] = await Promise.all([
    prisma.allergene.create({ data: { garderieId: garderie.id, nom: "Protéines de lait de vache" } }),
    prisma.allergene.create({ data: { garderieId: garderie.id, nom: "Gluten" } }),
  ]);
  await prisma.allergene.createMany({
    data: [
      { garderieId: garderie.id, nom: "Œuf" },
      { garderieId: garderie.id, nom: "Arachide" },
      { garderieId: garderie.id, nom: "Fruits à coque" },
    ],
  });

  await prisma.allergieEnfant.create({
    data: { enfantId: kiivai.id, allergeneId: allergeneLait.id, note: "Lait infantile fourni par les parents" },
  });
  await prisma.allergieEnfant.create({
    data: { enfantId: emma.id, allergeneId: allergeneGluten.id },
  });

  const [
    alimentPoisson,
    alimentRiz,
    alimentLegumes,
    alimentPoulet,
    alimentPuree,
    alimentLait,
    alimentCompote,
    alimentYaourt,
    alimentFruit,
    alimentPain,
  ] = await Promise.all([
    prisma.aliment.create({ data: { garderieId: garderie.id, nom: "Poisson", categorieAlimentaire: "Protéine" } }),
    prisma.aliment.create({ data: { garderieId: garderie.id, nom: "Riz", categorieAlimentaire: "Féculent" } }),
    prisma.aliment.create({ data: { garderieId: garderie.id, nom: "Légumes", categorieAlimentaire: "Légume" } }),
    prisma.aliment.create({ data: { garderieId: garderie.id, nom: "Poulet", categorieAlimentaire: "Protéine" } }),
    prisma.aliment.create({ data: { garderieId: garderie.id, nom: "Purée", categorieAlimentaire: "Légume" } }),
    prisma.aliment.create({ data: { garderieId: garderie.id, nom: "Lait", categorieAlimentaire: "Laitage" } }),
    prisma.aliment.create({ data: { garderieId: garderie.id, nom: "Compote", categorieAlimentaire: "Fruit" } }),
    prisma.aliment.create({ data: { garderieId: garderie.id, nom: "Yaourt", categorieAlimentaire: "Laitage" } }),
    prisma.aliment.create({ data: { garderieId: garderie.id, nom: "Fruit", categorieAlimentaire: "Fruit" } }),
    prisma.aliment.create({ data: { garderieId: garderie.id, nom: "Pain", categorieAlimentaire: "Féculent" } }),
  ]);

  await prisma.alimentAllergene.createMany({
    data: [
      { alimentId: alimentLait.id, allergeneId: allergeneLait.id },
      { alimentId: alimentYaourt.id, allergeneId: allergeneLait.id },
      { alimentId: alimentPain.id, allergeneId: allergeneGluten.id },
    ],
  });

  const [typePetitDejeuner, typeDejeuner, typeGouter] = await Promise.all([
    prisma.typeRepas.create({ data: { garderieId: garderie.id, nom: "Petit-déjeuner", ordre: 0 } }),
    prisma.typeRepas.create({ data: { garderieId: garderie.id, nom: "Déjeuner", ordre: 1 } }),
    prisma.typeRepas.create({ data: { garderieId: garderie.id, nom: "Goûter", ordre: 2 } }),
  ]);

  const semaine = await prisma.semaineMenu.create({
    data: { garderieId: garderie.id, dateDebut: lundiDeLaSemaine(), statut: "PUBLIE" },
  });

  // Menu général — lundi (jourSemaine 0)
  await prisma.menuEntree.create({
    data: {
      semaineId: semaine.id,
      jourSemaine: 0,
      typeRepasId: typePetitDejeuner.id,
      portee: "GENERAL",
      composants: { create: [{ alimentId: alimentLait.id, ordre: 0 }, { alimentId: alimentCompote.id, ordre: 1 }] },
    },
  });
  await prisma.menuEntree.create({
    data: {
      semaineId: semaine.id,
      jourSemaine: 0,
      typeRepasId: typeDejeuner.id,
      portee: "GENERAL",
      composants: {
        create: [
          { alimentId: alimentPoisson.id, ordre: 0 },
          { alimentId: alimentRiz.id, ordre: 1 },
          { alimentId: alimentLegumes.id, ordre: 2 },
        ],
      },
    },
  });
  await prisma.menuEntree.create({
    data: {
      semaineId: semaine.id,
      jourSemaine: 0,
      typeRepasId: typeGouter.id,
      portee: "GENERAL",
      composants: { create: [{ alimentId: alimentYaourt.id, ordre: 0 }, { alimentId: alimentFruit.id, ordre: 1 }] },
    },
  });

  // Menu catégorie « Bébés » — lundi midi : remplace poisson+légumes par poulet+purée
  await prisma.menuEntree.create({
    data: {
      semaineId: semaine.id,
      jourSemaine: 0,
      typeRepasId: typeDejeuner.id,
      portee: "CATEGORIE",
      groupeId: groupeBebes.id,
      composants: {
        create: [
          { alimentId: alimentPoulet.id, ordre: 0, remplaceAlimentId: alimentPoisson.id, motifRemplacement: "Adapté à l'âge (bébés)" },
          { alimentId: alimentPuree.id, ordre: 1, remplaceAlimentId: alimentLegumes.id, motifRemplacement: "Adapté à l'âge (bébés)" },
        ],
      },
    },
  });

  // Menu individuel — Kiivai (allergie aux protéines de lait de vache) : lundi goûter
  await prisma.menuEntree.create({
    data: {
      semaineId: semaine.id,
      jourSemaine: 0,
      typeRepasId: typeGouter.id,
      portee: "INDIVIDUEL",
      enfantId: kiivai.id,
      note: "Allergie aux protéines de lait de vache",
      composants: {
        create: [
          { alimentId: alimentCompote.id, ordre: 0, remplaceAlimentId: alimentYaourt.id, motifRemplacement: "Allergie aux protéines de lait de vache" },
          { alimentId: alimentFruit.id, ordre: 1 },
        ],
      },
    },
  });

  // Menu général — mardi : petit-déjeuner avec du pain (gluten), volontairement
  // sans adaptation pour Emma (allergique au gluten) afin d'illustrer l'alerte
  // allergène non résolue dans la vue « Alertes ».
  await prisma.menuEntree.create({
    data: {
      semaineId: semaine.id,
      jourSemaine: 1,
      typeRepasId: typePetitDejeuner.id,
      portee: "GENERAL",
      composants: { create: [{ alimentId: alimentPain.id, ordre: 0 }, { alimentId: alimentLait.id, ordre: 1 }] },
    },
  });
  await prisma.menuEntree.create({
    data: {
      semaineId: semaine.id,
      jourSemaine: 1,
      typeRepasId: typeDejeuner.id,
      portee: "GENERAL",
      composants: { create: [{ alimentId: alimentPoulet.id, ordre: 0 }, { alimentId: alimentRiz.id, ordre: 1 }] },
    },
  });
  await prisma.menuEntree.create({
    data: {
      semaineId: semaine.id,
      jourSemaine: 1,
      typeRepasId: typeGouter.id,
      portee: "GENERAL",
      composants: { create: [{ alimentId: alimentCompote.id, ordre: 0 }] },
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

  // -------------------------------------------------------------------
  // Comptes de test ("personas") pour valider le parcours complet de
  // chaque rôle : un parent de deux enfants, une tatie très sollicitée
  // (affectée à la quasi-totalité du groupe) et une seconde direction.
  // -------------------------------------------------------------------

  const [testParent, testTatie, testDirectrice] = await Promise.all([
    prisma.user.create({
      data: {
        email: "test.parent@pitilink.local",
        passwordHash: hash,
        prenom: "Test",
        nom: "Parent",
        role: "PARENT",
        garderieId: garderie.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "test.tatie@pitilink.local",
        passwordHash: hash,
        prenom: "Test",
        nom: "Tatie",
        role: "PROFESSIONNEL",
        garderieId: garderie.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "test.directrice@pitilink.local",
        passwordHash: hash,
        prenom: "Test",
        nom: "Directrice",
        role: "DIRECTION",
        garderieId: garderie.id,
      },
    }),
  ]);

  const noe = await prisma.enfant.create({
    data: {
      garderieId: garderie.id,
      groupeId: groupeBebes.id,
      prenom: "Noé",
      nom: "Rivière",
      dateNaissance: new Date(Date.now() - 240 * 86400000), // ~8 mois
      sexe: "GARCON",
      dateInscription: new Date(Date.now() - 60 * 86400000),
      dateDebutAccueil: new Date(Date.now() - 45 * 86400000),
      statut: "ACTIF",
      autorisationPhotos: "AUTORISEE",
      joursPresence: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
      horaireHabituel: "08h00 - 18h00",
    },
  });

  const alice = await prisma.enfant.create({
    data: {
      garderieId: garderie.id,
      groupeId: groupeMoyens.id,
      prenom: "Alice",
      nom: "Rivière",
      dateNaissance: new Date(Date.now() - 910 * 86400000), // ~2 ans et demi
      sexe: "FILLE",
      dateInscription: new Date(Date.now() - 60 * 86400000),
      dateDebutAccueil: new Date(Date.now() - 45 * 86400000),
      statut: "ACTIF",
      autorisationPhotos: "AUTORISEE",
      joursPresence: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
      horaireHabituel: "08h00 - 18h00",
    },
  });

  await prisma.parentEnfant.createMany({
    data: [
      { enfantId: noe.id, userId: testParent.id, lien: "AUTRE", estContactUrgence: true },
      { enfantId: alice.id, userId: testParent.id, lien: "AUTRE", estContactUrgence: true },
    ],
  });

  await prisma.contactUrgence.createMany({
    data: [
      { enfantId: noe.id, nom: "Parent", prenom: "Test", lien: "Parent", telephone: "06 00 00 00 01", ordrePriorite: 1 },
      { enfantId: alice.id, nom: "Parent", prenom: "Test", lien: "Parent", telephone: "06 00 00 00 01", ordrePriorite: 1 },
    ],
  });

  // La tatie de test est volontairement très chargée : référente des deux
  // nouveaux enfants, et en renfort (non référente) sur les trois enfants
  // existants qui ont déjà chacun leur référente habituelle.
  await prisma.affectation.createMany({
    data: [
      { enfantId: noe.id, professionnelId: testTatie.id, groupeId: groupeBebes.id, referente: true, joursSemaine: [1, 2, 3, 4, 5] },
      { enfantId: alice.id, professionnelId: testTatie.id, groupeId: groupeMoyens.id, referente: true, joursSemaine: [1, 2, 3, 4, 5] },
      { enfantId: kiivai.id, professionnelId: testTatie.id, groupeId: groupeBebes.id, referente: false, joursSemaine: [1, 2, 3, 4, 5] },
      { enfantId: emma.id, professionnelId: testTatie.id, groupeId: groupeBebes.id, referente: false, joursSemaine: [1, 2, 3, 4, 5] },
      { enfantId: noah.id, professionnelId: testTatie.id, groupeId: groupeMoyens.id, referente: false, joursSemaine: [1, 2, 3, 4, 5] },
    ],
  });

  await prisma.presence.createMany({
    data: [
      { enfantId: noe.id, date: aujourdhui, statut: "PRESENT", heureArrivee: new Date(new Date().setHours(8, 5)) },
      { enfantId: alice.id, date: aujourdhui, statut: "PRESENT", heureArrivee: new Date(new Date().setHours(8, 20)) },
    ],
  });

  await prisma.journalEvenement.createMany({
    data: [
      { garderieId: garderie.id, enfantId: noe.id, type: "ARRIVEE", statut: "REALISE", timestamp: heure(8, 5), auteurId: testTatie.id },
      {
        garderieId: garderie.id,
        enfantId: noe.id,
        type: "BIBERON",
        statut: "REALISE",
        timestamp: heure(9, 0),
        auteurId: testTatie.id,
        donneesReelles: JSON.stringify({ quantiteMl: 180, type: "lait infantile" }),
      },
      {
        garderieId: garderie.id,
        enfantId: noe.id,
        type: "SIESTE",
        statut: "REALISE",
        timestamp: heure(10, 0),
        auteurId: testTatie.id,
        donneesReelles: JSON.stringify({ heureDebut: "10:00", heureFin: "11:15", qualite: "bien" }),
      },
      { garderieId: garderie.id, enfantId: alice.id, type: "ARRIVEE", statut: "REALISE", timestamp: heure(8, 20), auteurId: testTatie.id },
      {
        garderieId: garderie.id,
        enfantId: alice.id,
        type: "REPAS",
        statut: "REALISE",
        timestamp: heure(11, 45),
        auteurId: testTatie.id,
        donneesReelles: JSON.stringify({ repas: "Déjeuner", quantite: "Bien mangé" }),
      },
      {
        garderieId: garderie.id,
        enfantId: alice.id,
        type: "ACTIVITE",
        statut: "REALISE",
        timestamp: heure(14, 30),
        auteurId: testTatie.id,
        donneesReelles: JSON.stringify({ nom: "Motricité libre" }),
      },
      {
        garderieId: garderie.id,
        enfantId: alice.id,
        type: "OBSERVATION",
        statut: "REALISE",
        timestamp: heure(16, 0),
        auteurId: testTatie.id,
        commentaire: "Très joueuse aujourd'hui, a bien participé à l'activité motricité.",
      },
    ],
  });

  await prisma.croissance.createMany({
    data: [
      { enfantId: noe.id, date: aujourdhui, poidsKg: 8.1, tailleCm: 68, perimetreCranienCm: 43, auteurId: testTatie.id },
      { enfantId: alice.id, date: aujourdhui, poidsKg: 13.4, tailleCm: 91, auteurId: testTatie.id },
    ],
  });

  // Une absence maladie sans certificat (donc facturée) : un "souci" de
  // facturation concret pour la direction de test.
  await prisma.absence.create({
    data: {
      enfantId: noe.id,
      type: "MALADIE",
      dateDebut: aujourdhui,
      dateFin: aujourdhui,
      commentaire: "Fièvre dans la nuit, garde à la maison aujourd'hui.",
      declareParId: testParent.id,
    },
  });

  return {
    motDePasse: MOT_DE_PASSE_DEMO,
    comptes: {
      admin: admin.email,
      direction: "direction.demo@pitilink.local",
      responsable: "responsable.demo@pitilink.local",
      professionnels: ["ana.demo@pitilink.local", "julie.demo@pitilink.local"],
      parents: ["parent.demo@pitilink.local", "papa.demo@pitilink.local"],
      testParent: testParent.email,
      testTatie: testTatie.email,
      testDirectrice: testDirectrice.email,
    },
  };
}
