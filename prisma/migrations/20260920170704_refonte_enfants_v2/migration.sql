-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('GARCON', 'FILLE');

-- AlterTable
ALTER TABLE "enfants" ADD COLUMN     "horaireHabituel" TEXT,
ADD COLUMN     "joursPresence" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "medecinNom" TEXT,
ADD COLUMN     "medecinTelephone" TEXT,
ADD COLUMN     "sexe" "Sexe";

-- CreateTable
CREATE TABLE "traitements" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traitements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_enfant" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "titre" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "historique_enfant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "traitements_enfantId_idx" ON "traitements"("enfantId");

-- CreateIndex
CREATE INDEX "historique_enfant_enfantId_idx" ON "historique_enfant"("enfantId");

-- AddForeignKey
ALTER TABLE "traitements" ADD CONSTRAINT "traitements_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_enfant" ADD CONSTRAINT "historique_enfant_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
