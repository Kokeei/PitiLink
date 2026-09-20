-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tentativesEchoueesConnexion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verrouJusqua" TIMESTAMP(3);
