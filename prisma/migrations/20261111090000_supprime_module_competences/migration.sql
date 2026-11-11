-- DropForeignKey
ALTER TABLE "acquisitions_competences" DROP CONSTRAINT "acquisitions_competences_auteurId_fkey";

-- DropForeignKey
ALTER TABLE "acquisitions_competences" DROP CONSTRAINT "acquisitions_competences_competenceId_fkey";

-- DropForeignKey
ALTER TABLE "acquisitions_competences" DROP CONSTRAINT "acquisitions_competences_enfantId_fkey";

-- DropForeignKey
ALTER TABLE "acquisitions_competences" DROP CONSTRAINT "acquisitions_competences_garderieId_fkey";

-- DropForeignKey
ALTER TABLE "acquisitions_competences" DROP CONSTRAINT "acquisitions_competences_groupeId_fkey";

-- DropForeignKey
ALTER TABLE "acquisitions_competences" DROP CONSTRAINT "acquisitions_competences_modifieParId_fkey";

-- DropForeignKey
ALTER TABLE "categories_competences" DROP CONSTRAINT "categories_competences_garderieId_fkey";

-- DropForeignKey
ALTER TABLE "competences" DROP CONSTRAINT "competences_categorieId_fkey";

-- DropForeignKey
ALTER TABLE "competences" DROP CONSTRAINT "competences_garderieId_fkey";

-- DropTable
DROP TABLE "acquisitions_competences";

-- DropTable
DROP TABLE "categories_competences";

-- DropTable
DROP TABLE "competences";

