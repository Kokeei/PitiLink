/*
  Warnings:

  - You are about to drop the `menus_jour` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatutMenu" AS ENUM ('BROUILLON', 'PUBLIE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "PorteeMenu" AS ENUM ('GENERAL', 'CATEGORIE', 'INDIVIDUEL');

-- DropForeignKey
ALTER TABLE "menus_jour" DROP CONSTRAINT "menus_jour_garderieId_fkey";

-- DropTable
DROP TABLE "menus_jour";

-- CreateTable
CREATE TABLE "allergies_enfant" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "allergeneId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allergies_enfant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergenes" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allergenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aliments" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorieAlimentaire" TEXT,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aliments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aliment_allergenes" (
    "id" TEXT NOT NULL,
    "alimentId" TEXT NOT NULL,
    "allergeneId" TEXT NOT NULL,

    CONSTRAINT "aliment_allergenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "types_repas" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "types_repas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semaines_menu" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "statut" "StatutMenu" NOT NULL DEFAULT 'BROUILLON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semaines_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_entrees" (
    "id" TEXT NOT NULL,
    "semaineId" TEXT NOT NULL,
    "jourSemaine" INTEGER NOT NULL,
    "typeRepasId" TEXT NOT NULL,
    "portee" "PorteeMenu" NOT NULL,
    "groupeId" TEXT,
    "enfantId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_entrees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_composants" (
    "id" TEXT NOT NULL,
    "menuEntreeId" TEXT NOT NULL,
    "alimentId" TEXT NOT NULL,
    "remplaceAlimentId" TEXT,
    "motifRemplacement" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_composants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "allergies_enfant_enfantId_idx" ON "allergies_enfant"("enfantId");

-- CreateIndex
CREATE UNIQUE INDEX "allergies_enfant_enfantId_allergeneId_key" ON "allergies_enfant"("enfantId", "allergeneId");

-- CreateIndex
CREATE INDEX "allergenes_garderieId_idx" ON "allergenes"("garderieId");

-- CreateIndex
CREATE UNIQUE INDEX "allergenes_garderieId_nom_key" ON "allergenes"("garderieId", "nom");

-- CreateIndex
CREATE INDEX "aliments_garderieId_idx" ON "aliments"("garderieId");

-- CreateIndex
CREATE UNIQUE INDEX "aliment_allergenes_alimentId_allergeneId_key" ON "aliment_allergenes"("alimentId", "allergeneId");

-- CreateIndex
CREATE INDEX "types_repas_garderieId_idx" ON "types_repas"("garderieId");

-- CreateIndex
CREATE UNIQUE INDEX "types_repas_garderieId_nom_key" ON "types_repas"("garderieId", "nom");

-- CreateIndex
CREATE INDEX "semaines_menu_garderieId_idx" ON "semaines_menu"("garderieId");

-- CreateIndex
CREATE UNIQUE INDEX "semaines_menu_garderieId_dateDebut_key" ON "semaines_menu"("garderieId", "dateDebut");

-- CreateIndex
CREATE INDEX "menu_entrees_semaineId_jourSemaine_typeRepasId_idx" ON "menu_entrees"("semaineId", "jourSemaine", "typeRepasId");

-- CreateIndex
CREATE INDEX "menu_entrees_groupeId_idx" ON "menu_entrees"("groupeId");

-- CreateIndex
CREATE INDEX "menu_entrees_enfantId_idx" ON "menu_entrees"("enfantId");

-- CreateIndex
CREATE INDEX "menu_composants_menuEntreeId_idx" ON "menu_composants"("menuEntreeId");

-- AddForeignKey
ALTER TABLE "allergies_enfant" ADD CONSTRAINT "allergies_enfant_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergies_enfant" ADD CONSTRAINT "allergies_enfant_allergeneId_fkey" FOREIGN KEY ("allergeneId") REFERENCES "allergenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergenes" ADD CONSTRAINT "allergenes_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aliments" ADD CONSTRAINT "aliments_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aliment_allergenes" ADD CONSTRAINT "aliment_allergenes_alimentId_fkey" FOREIGN KEY ("alimentId") REFERENCES "aliments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aliment_allergenes" ADD CONSTRAINT "aliment_allergenes_allergeneId_fkey" FOREIGN KEY ("allergeneId") REFERENCES "allergenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "types_repas" ADD CONSTRAINT "types_repas_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semaines_menu" ADD CONSTRAINT "semaines_menu_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_entrees" ADD CONSTRAINT "menu_entrees_semaineId_fkey" FOREIGN KEY ("semaineId") REFERENCES "semaines_menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_entrees" ADD CONSTRAINT "menu_entrees_typeRepasId_fkey" FOREIGN KEY ("typeRepasId") REFERENCES "types_repas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_entrees" ADD CONSTRAINT "menu_entrees_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_entrees" ADD CONSTRAINT "menu_entrees_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_composants" ADD CONSTRAINT "menu_composants_menuEntreeId_fkey" FOREIGN KEY ("menuEntreeId") REFERENCES "menu_entrees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_composants" ADD CONSTRAINT "menu_composants_alimentId_fkey" FOREIGN KEY ("alimentId") REFERENCES "aliments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_composants" ADD CONSTRAINT "menu_composants_remplaceAlimentId_fkey" FOREIGN KEY ("remplaceAlimentId") REFERENCES "aliments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
