-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'PROFESSIONNEL', 'RESPONSABLE', 'DIRECTION', 'ADMIN_PLATEFORME');

-- CreateEnum
CREATE TYPE "StatutEnfant" AS ENUM ('ACTIF', 'SUSPENDU', 'SORTI', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "LienFamilial" AS ENUM ('MERE', 'PERE', 'TUTEUR', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeInfoImportante" AS ENUM ('ALLERGIE', 'REGIME_ALIMENTAIRE', 'PROTOCOLE', 'OBJET_TRANSITIONNEL', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutPresence" AS ENUM ('PREVU', 'PRESENT', 'ABSENT', 'A_CONFIRMER');

-- CreateEnum
CREATE TYPE "TypeJournalEvenement" AS ENUM ('ARRIVEE', 'DEPART', 'BIBERON', 'REPAS', 'CHANGE', 'SIESTE', 'ACTIVITE', 'HUMEUR', 'BAIN', 'MEDICAMENT', 'INTERACTION', 'INCIDENT', 'OBSERVATION', 'SORTIE', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutJournalEvenement" AS ENUM ('PREVU', 'REALISE', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeAbsence" AS ENUM ('MALADIE', 'VACANCES', 'GARDE_DOMICILE', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutAbsence" AS ENUM ('DECLAREE', 'CONFIRMEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('CONTRAT', 'AUTORISATION', 'ORDONNANCE', 'JUSTIFICATIF', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeEvenementCalendrier" AS ENUM ('FETE', 'SORTIE', 'SPECTACLE', 'REUNION', 'FERMETURE', 'ACTIVITE_SPECIALE', 'ANNIVERSAIRE', 'AUTRE');

-- CreateTable
CREATE TABLE "garderies" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "logoUrl" TEXT,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "horaires" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garderies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "garderieId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groupes" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ageMinMois" INTEGER,
    "ageMaxMois" INTEGER,
    "capacite" INTEGER,
    "couleur" TEXT,

    CONSTRAINT "groupes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enfants" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "groupeId" TEXT,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "photoUrl" TEXT,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "dateInscription" TIMESTAMP(3),
    "dateDebutAccueil" TIMESTAMP(3),
    "statut" "StatutEnfant" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enfants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents_enfants" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lien" "LienFamilial" NOT NULL DEFAULT 'AUTRE',

    CONSTRAINT "parents_enfants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts_urgence" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "lien" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "telephoneSecondaire" TEXT,
    "ordrePriorite" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "contacts_urgence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnes_autorisees" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "lien" TEXT NOT NULL,
    "telephone" TEXT,
    "photoUrl" TEXT,
    "ponctuelle" BOOLEAN NOT NULL DEFAULT false,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),

    CONSTRAINT "personnes_autorisees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infos_importantes" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "type" "TypeInfoImportante" NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "critique" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infos_importantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affectations" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "professionnelId" TEXT NOT NULL,
    "groupeId" TEXT,
    "joursSemaine" INTEGER[],
    "heureDebut" TEXT,
    "heureFin" TEXT,
    "referente" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affectations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presences" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" "StatutPresence" NOT NULL DEFAULT 'PREVU',
    "heureArrivee" TIMESTAMP(3),
    "heureDepart" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_evenements" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "type" "TypeJournalEvenement" NOT NULL,
    "statut" "StatutJournalEvenement" NOT NULL DEFAULT 'REALISE',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteurId" TEXT,
    "donneesPrevues" TEXT,
    "donneesReelles" TEXT,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_evenements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "croissance" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "poidsKg" DOUBLE PRECISION,
    "tailleCm" DOUBLE PRECISION,
    "perimetreCranienCm" DOUBLE PRECISION,
    "auteurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "croissance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activites" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus_jour" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "petitDejeuner" TEXT,
    "dejeuner" TEXT,
    "gouter" TEXT,
    "autre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menus_jour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "type" "TypeAbsence" NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "justificatifUrl" TEXT,
    "commentaire" TEXT,
    "statut" "StatutAbsence" NOT NULL DEFAULT 'DECLAREE',
    "declareParId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "enfantId" TEXT,
    "type" "TypeDocument" NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dateExpiration" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "type" "TypeEvenementCalendrier" NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "confirmationRequise" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evenements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "titre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_garderieId_idx" ON "users"("garderieId");

-- CreateIndex
CREATE INDEX "groupes_garderieId_idx" ON "groupes"("garderieId");

-- CreateIndex
CREATE INDEX "enfants_garderieId_idx" ON "enfants"("garderieId");

-- CreateIndex
CREATE INDEX "enfants_groupeId_idx" ON "enfants"("groupeId");

-- CreateIndex
CREATE UNIQUE INDEX "parents_enfants_enfantId_userId_key" ON "parents_enfants"("enfantId", "userId");

-- CreateIndex
CREATE INDEX "contacts_urgence_enfantId_idx" ON "contacts_urgence"("enfantId");

-- CreateIndex
CREATE INDEX "personnes_autorisees_enfantId_idx" ON "personnes_autorisees"("enfantId");

-- CreateIndex
CREATE INDEX "infos_importantes_enfantId_idx" ON "infos_importantes"("enfantId");

-- CreateIndex
CREATE INDEX "affectations_enfantId_idx" ON "affectations"("enfantId");

-- CreateIndex
CREATE INDEX "affectations_professionnelId_idx" ON "affectations"("professionnelId");

-- CreateIndex
CREATE INDEX "presences_date_idx" ON "presences"("date");

-- CreateIndex
CREATE UNIQUE INDEX "presences_enfantId_date_key" ON "presences"("enfantId", "date");

-- CreateIndex
CREATE INDEX "journal_evenements_garderieId_idx" ON "journal_evenements"("garderieId");

-- CreateIndex
CREATE INDEX "journal_evenements_enfantId_timestamp_idx" ON "journal_evenements"("enfantId", "timestamp");

-- CreateIndex
CREATE INDEX "croissance_enfantId_date_idx" ON "croissance"("enfantId", "date");

-- CreateIndex
CREATE INDEX "activites_garderieId_idx" ON "activites"("garderieId");

-- CreateIndex
CREATE UNIQUE INDEX "menus_jour_garderieId_date_key" ON "menus_jour"("garderieId", "date");

-- CreateIndex
CREATE INDEX "absences_enfantId_idx" ON "absences"("enfantId");

-- CreateIndex
CREATE INDEX "documents_garderieId_idx" ON "documents"("garderieId");

-- CreateIndex
CREATE INDEX "documents_enfantId_idx" ON "documents"("enfantId");

-- CreateIndex
CREATE INDEX "evenements_garderieId_idx" ON "evenements"("garderieId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "notifications_userId_lu_idx" ON "notifications"("userId", "lu");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupes" ADD CONSTRAINT "groupes_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enfants" ADD CONSTRAINT "enfants_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enfants" ADD CONSTRAINT "enfants_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents_enfants" ADD CONSTRAINT "parents_enfants_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents_enfants" ADD CONSTRAINT "parents_enfants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts_urgence" ADD CONSTRAINT "contacts_urgence_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnes_autorisees" ADD CONSTRAINT "personnes_autorisees_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infos_importantes" ADD CONSTRAINT "infos_importantes_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_professionnelId_fkey" FOREIGN KEY ("professionnelId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_evenements" ADD CONSTRAINT "journal_evenements_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_evenements" ADD CONSTRAINT "journal_evenements_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_evenements" ADD CONSTRAINT "journal_evenements_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "croissance" ADD CONSTRAINT "croissance_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "croissance" ADD CONSTRAINT "croissance_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activites" ADD CONSTRAINT "activites_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus_jour" ADD CONSTRAINT "menus_jour_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_declareParId_fkey" FOREIGN KEY ("declareParId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements" ADD CONSTRAINT "evenements_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
