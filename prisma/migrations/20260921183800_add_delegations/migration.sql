-- CreateTable
CREATE TABLE "delegations" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "cibleUserId" TEXT NOT NULL,
    "creeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "termineeLe" TIMESTAMP(3),
    "expireLe" TIMESTAMP(3),

    CONSTRAINT "delegations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delegations_adminId_idx" ON "delegations"("adminId");

-- CreateIndex
CREATE INDEX "delegations_cibleUserId_idx" ON "delegations"("cibleUserId");

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_cibleUserId_fkey"
FOREIGN KEY ("cibleUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
