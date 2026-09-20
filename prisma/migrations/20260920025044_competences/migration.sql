-- CreateTable
CREATE TABLE "categories_competences" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "icone" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_competences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competences" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "icone" TEXT,
    "description" TEXT,
    "ordreAffichage" INTEGER NOT NULL DEFAULT 0,
    "ageIndicatifMoisMin" INTEGER,
    "ageIndicatifMoisMax" INTEGER,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acquisitions_competences" (
    "id" TEXT NOT NULL,
    "garderieId" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "groupeId" TEXT,
    "dateObservation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "photoUrl" TEXT,
    "auteurId" TEXT NOT NULL,
    "noteOriginale" TEXT,
    "modifieParId" TEXT,
    "modifieLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acquisitions_competences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_competences_garderieId_idx" ON "categories_competences"("garderieId");

-- CreateIndex
CREATE INDEX "competences_garderieId_idx" ON "competences"("garderieId");

-- CreateIndex
CREATE INDEX "competences_categorieId_idx" ON "competences"("categorieId");

-- CreateIndex
CREATE INDEX "acquisitions_competences_garderieId_idx" ON "acquisitions_competences"("garderieId");

-- CreateIndex
CREATE INDEX "acquisitions_competences_enfantId_dateObservation_idx" ON "acquisitions_competences"("enfantId", "dateObservation");

-- CreateIndex
CREATE INDEX "acquisitions_competences_competenceId_idx" ON "acquisitions_competences"("competenceId");

-- AddForeignKey
ALTER TABLE "categories_competences" ADD CONSTRAINT "categories_competences_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competences" ADD CONSTRAINT "competences_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competences" ADD CONSTRAINT "competences_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categories_competences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquisitions_competences" ADD CONSTRAINT "acquisitions_competences_garderieId_fkey" FOREIGN KEY ("garderieId") REFERENCES "garderies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquisitions_competences" ADD CONSTRAINT "acquisitions_competences_enfantId_fkey" FOREIGN KEY ("enfantId") REFERENCES "enfants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquisitions_competences" ADD CONSTRAINT "acquisitions_competences_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "competences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquisitions_competences" ADD CONSTRAINT "acquisitions_competences_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquisitions_competences" ADD CONSTRAINT "acquisitions_competences_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquisitions_competences" ADD CONSTRAINT "acquisitions_competences_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
