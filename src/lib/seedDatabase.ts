import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";
import { lundiDeLaSemaine } from "@/lib/menus";

export const MOT_DE_PASSE_DEMO = "Password123!";

/**
 * Peuple une base vide avec la garderie de démonstration (données du MVP +
 * du module compétences). Idempotence : à appeler uniquement si la base est
 * vide (voir la garde dans /api/setup et prisma/seed.ts).
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
  // Suivi du développement : catégories + catalogue de compétences (§90)
  // -------------------------------------------------------------------

  const categoriesData = [
    { key: "cognition", nom: "Cognition / éveil", icone: "🧠", ordre: 1 },
    { key: "langage", nom: "Langage et communication", icone: "🗣️", ordre: 2 },
    { key: "motriciteGlobale", nom: "Motricité globale", icone: "🐾", ordre: 3 },
    { key: "motriciteFine", nom: "Motricité fine", icone: "✋", ordre: 4 },
    { key: "socialisation", nom: "Socialisation", icone: "❤️", ordre: 5 },
    { key: "autonomie", nom: "Autonomie", icone: "🧸", ordre: 6 },
    { key: "creativite", nom: "Créativité", icone: "🎨", ordre: 7 },
    { key: "sensoriel", nom: "Éveil sensoriel", icone: "👂", ordre: 8 },
    { key: "musical", nom: "Éveil musical", icone: "🎵", ordre: 9 },
  ] as const;

  const categories: Record<(typeof categoriesData)[number]["key"], { id: string }> = {} as never;
  for (const c of categoriesData) {
    categories[c.key] = await prisma.categorieCompetence.create({
      data: { garderieId: garderie.id, nom: c.nom, icone: c.icone, ordre: c.ordre },
    });
  }

  const competencesData: {
    categorie: (typeof categoriesData)[number]["key"];
    nom: string;
    icone: string;
    ageMin?: number;
    ageMax?: number;
  }[] = [
    // Motricité globale
    { categorie: "motriciteGlobale", nom: "Se retourne", icone: "🐾", ageMin: 3, ageMax: 5 },
    { categorie: "motriciteGlobale", nom: "Se met sur le ventre", icone: "🐾", ageMin: 2, ageMax: 4 },
    { categorie: "motriciteGlobale", nom: "Rampe", icone: "🐾", ageMin: 6, ageMax: 10 },
    { categorie: "motriciteGlobale", nom: "Marche à quatre pattes", icone: "🐾", ageMin: 7, ageMax: 10 },
    { categorie: "motriciteGlobale", nom: "Se met debout", icone: "🧍", ageMin: 8, ageMax: 12 },
    { categorie: "motriciteGlobale", nom: "Se déplace avec appui", icone: "🐾", ageMin: 9, ageMax: 13 },
    { categorie: "motriciteGlobale", nom: "Premiers pas", icone: "🏆", ageMin: 10, ageMax: 14 },
    { categorie: "motriciteGlobale", nom: "Marche seul", icone: "🚶", ageMin: 12, ageMax: 18 },
    { categorie: "motriciteGlobale", nom: "Monte quelques marches", icone: "🐾", ageMin: 15, ageMax: 24 },
    // Motricité fine
    { categorie: "motriciteFine", nom: "Attrape un objet", icone: "✋", ageMin: 3, ageMax: 5 },
    { categorie: "motriciteFine", nom: "Passe un objet d'une main à l'autre", icone: "✋", ageMin: 5, ageMax: 7 },
    { categorie: "motriciteFine", nom: "Applaudit", icone: "👏", ageMin: 6, ageMax: 10 },
    { categorie: "motriciteFine", nom: "Empile des cubes", icone: "🧩", ageMin: 12, ageMax: 18 },
    { categorie: "motriciteFine", nom: "Encastre une forme", icone: "✋", ageMin: 15, ageMax: 24 },
    { categorie: "motriciteFine", nom: "Tourne les pages d'un livre", icone: "📖", ageMin: 12, ageMax: 18 },
    { categorie: "motriciteFine", nom: "Tient un crayon", icone: "✏️", ageMin: 18, ageMax: 24 },
    { categorie: "motriciteFine", nom: "Dessine / gribouille", icone: "🎨", ageMin: 18, ageMax: 30 },
    // Langage et communication
    { categorie: "langage", nom: "Réagit à son prénom", icone: "🗣️", ageMin: 4, ageMax: 7 },
    { categorie: "langage", nom: "Imite des sons", icone: "🗣️", ageMin: 6, ageMax: 9 },
    { categorie: "langage", nom: "Fait coucou", icone: "👋", ageMin: 8, ageMax: 12 },
    { categorie: "langage", nom: "Pointe du doigt", icone: "👉", ageMin: 9, ageMax: 13 },
    { categorie: "langage", nom: "Utilise un geste pour demander", icone: "🗣️", ageMin: 10, ageMax: 14 },
    { categorie: "langage", nom: "Premiers mots", icone: "🗣️", ageMin: 10, ageMax: 16 },
    { categorie: "langage", nom: "Assemble plusieurs mots", icone: "🗣️", ageMin: 18, ageMax: 24 },
    { categorie: "langage", nom: "Participe à une conversation", icone: "🗣️", ageMin: 24, ageMax: 36 },
    // Socialisation
    { categorie: "socialisation", nom: "Sourit en réponse à une interaction", icone: "❤️", ageMin: 1, ageMax: 3 },
    { categorie: "socialisation", nom: "Imite les autres enfants", icone: "❤️", ageMin: 12, ageMax: 18 },
    { categorie: "socialisation", nom: "Participe à un jeu collectif", icone: "❤️", ageMin: 18, ageMax: 30 },
    { categorie: "socialisation", nom: "Joue avec les autres", icone: "❤️", ageMin: 24, ageMax: 36 },
    { categorie: "socialisation", nom: "Attend son tour", icone: "❤️", ageMin: 24, ageMax: 36 },
    { categorie: "socialisation", nom: "Partage un jeu ou un objet", icone: "❤️", ageMin: 24, ageMax: 36 },
    // Autonomie
    { categorie: "autonomie", nom: "Mange avec les doigts", icone: "🧸", ageMin: 8, ageMax: 12 },
    { categorie: "autonomie", nom: "Mange à la cuillère", icone: "🥄", ageMin: 12, ageMax: 18 },
    { categorie: "autonomie", nom: "Boit seul", icone: "🧸", ageMin: 12, ageMax: 18 },
    { categorie: "autonomie", nom: "Participe à l'habillage", icone: "🧸", ageMin: 18, ageMax: 24 },
    { categorie: "autonomie", nom: "Range un jouet", icone: "🧸", ageMin: 18, ageMax: 24 },
    { categorie: "autonomie", nom: "Se lave les mains avec accompagnement", icone: "🧸", ageMin: 18, ageMax: 24 },
    { categorie: "autonomie", nom: "Participe au rangement", icone: "🧸", ageMin: 24, ageMax: 36 },
    // Éveil / activités
    { categorie: "cognition", nom: "Écoute une histoire", icone: "🧠", ageMin: 6, ageMax: 12 },
    { categorie: "cognition", nom: "Suit une consigne simple", icone: "🧠", ageMin: 12, ageMax: 18 },
    { categorie: "cognition", nom: "Reproduit un geste ou un mouvement", icone: "🧠", ageMin: 9, ageMax: 15 },
    { categorie: "creativite", nom: "Participe à une activité artistique", icone: "🎨", ageMin: 9, ageMax: 18 },
    { categorie: "sensoriel", nom: "Participe à une activité sensorielle", icone: "👂", ageMin: 3, ageMax: 12 },
    { categorie: "musical", nom: "Participe à une activité musicale", icone: "🎵", ageMin: 3, ageMax: 12 },
  ];

  const competences: Record<string, { id: string }> = {};
  for (const [index, c] of competencesData.entries()) {
    competences[c.nom] = await prisma.competence.create({
      data: {
        garderieId: garderie.id,
        categorieId: categories[c.categorie].id,
        nom: c.nom,
        icone: c.icone,
        ordreAffichage: index,
        ageIndicatifMoisMin: c.ageMin,
        ageIndicatifMoisMax: c.ageMax,
      },
    });
  }

  const ilYA = (jours: number) => {
    const d = new Date();
    d.setDate(d.getDate() - jours);
    return d;
  };

  await prisma.acquisitionCompetence.createMany({
    data: [
      {
        garderieId: garderie.id,
        enfantId: kiivai.id,
        competenceId: competences["Fait coucou"].id,
        groupeId: groupeBebes.id,
        auteurId: ana.id,
        dateObservation: ilYA(18),
        note: "A fait coucou de lui-même en fin de journée.",
      },
      {
        garderieId: garderie.id,
        enfantId: kiivai.id,
        competenceId: competences["Applaudit"].id,
        groupeId: groupeBebes.id,
        auteurId: ana.id,
        dateObservation: ilYA(12),
      },
      {
        garderieId: garderie.id,
        enfantId: kiivai.id,
        competenceId: competences["Se met debout"].id,
        groupeId: groupeBebes.id,
        auteurId: ana.id,
        dateObservation: ilYA(5),
        note: "Se met debout en s'appuyant sur le canapé.",
      },
      {
        garderieId: garderie.id,
        enfantId: kiivai.id,
        competenceId: competences["Marche à quatre pattes"].id,
        groupeId: groupeBebes.id,
        auteurId: ana.id,
        dateObservation: aujourdhui,
        note: "S'est déplacée seule sur plusieurs mètres.",
      },
    ],
  });

  return {
    motDePasse: MOT_DE_PASSE_DEMO,
    comptes: {
      direction: "direction.demo@pitilink.local",
      responsable: "responsable.demo@pitilink.local",
      professionnels: ["ana.demo@pitilink.local", "julie.demo@pitilink.local"],
      parents: ["parent.demo@pitilink.local", "papa.demo@pitilink.local"],
    },
  };
}
