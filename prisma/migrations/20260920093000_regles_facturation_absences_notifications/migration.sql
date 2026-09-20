-- AlterTable
ALTER TABLE "garderies" ADD COLUMN     "absenceDelaiPreavisJours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "absenceMaladieCertificatDecompte" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "absenceMaladieSansCertificatDecompte" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "lien" TEXT;

-- AlterEnum
-- StatutAbsence.CONFIRMEE/REFUSEE n'ont jamais été assignées par le code
-- applicatif (aucune action ne les écrivait) : normalisation défensive avant
-- de réduire l'enum, au cas où une valeur aurait été posée manuellement.
BEGIN;
UPDATE "absences" SET "statut" = 'DECLAREE' WHERE "statut" NOT IN ('DECLAREE');
CREATE TYPE "StatutAbsence_new" AS ENUM ('DECLAREE', 'ANNULEE');
ALTER TABLE "absences" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "absences" ALTER COLUMN "statut" TYPE "StatutAbsence_new" USING ("statut"::text::"StatutAbsence_new");
ALTER TYPE "StatutAbsence" RENAME TO "StatutAbsence_old";
ALTER TYPE "StatutAbsence_new" RENAME TO "StatutAbsence";
DROP TYPE "StatutAbsence_old";
ALTER TABLE "absences" ALTER COLUMN "statut" SET DEFAULT 'DECLAREE';
COMMIT;
