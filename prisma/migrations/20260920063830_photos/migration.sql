-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "legende" TEXT,
    "auteurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "photos_garderieId_idx" ON "photos"("garderieId");

-- CreateIndex
CREATE INDEX "photos_enfantId_idx" ON "photos"("enfantId");

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
