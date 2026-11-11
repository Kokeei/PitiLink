-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "titre",
ADD COLUMN     "enfantId" TEXT NOT NULL,
ADD COLUMN     "garderieId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "conversations_enfantId_key" ON "conversations"("enfantId");

-- CreateIndex
CREATE INDEX "conversations_garderieId_idx" ON "conversations"("garderieId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

