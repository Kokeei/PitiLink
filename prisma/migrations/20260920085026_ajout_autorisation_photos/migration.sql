-- CreateEnum
CREATE TYPE "AutorisationDiffusion" AS ENUM ('NON_RENSEIGNEE', 'AUTORISEE', 'REFUSEE');

-- AlterTable
ALTER TABLE "enfants" ADD COLUMN     "autorisationPhotos" "AutorisationDiffusion" NOT NULL DEFAULT 'NON_RENSEIGNEE';
