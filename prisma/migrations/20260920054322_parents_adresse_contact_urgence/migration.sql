-- AlterTable
ALTER TABLE "enfants" ADD COLUMN     "adresse" TEXT;

-- AlterTable
ALTER TABLE "parents_enfants" ADD COLUMN     "estContactUrgence" BOOLEAN NOT NULL DEFAULT false;
