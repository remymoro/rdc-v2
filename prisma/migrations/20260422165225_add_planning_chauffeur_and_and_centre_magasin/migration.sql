/*
  Warnings:

  - Added the required column `typePlanning` to the `Slot` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TypePlanning" AS ENUM ('MAGASIN', 'BENEVOLES_CENTRE', 'CHAUFFEUR');

-- DropForeignKey
ALTER TABLE "Slot" DROP CONSTRAINT "Slot_magasinId_fkey";

-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "centreId" TEXT,
ADD COLUMN     "planningBenevolesCentreId" TEXT,
ADD COLUMN     "planningChauffeurId" TEXT,
ADD COLUMN     "planningMagasinId" TEXT,
ADD COLUMN     "typePlanning" "TypePlanning" NOT NULL,
ALTER COLUMN "magasinId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PlanningMagasin" (
    "id" TEXT NOT NULL,
    "collecteId" TEXT NOT NULL,
    "magasinId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningMagasin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningBenevolesCentre" (
    "id" TEXT NOT NULL,
    "collecteId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningBenevolesCentre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningChauffeur" (
    "id" TEXT NOT NULL,
    "collecteId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningChauffeur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningMagasin_collecteId_idx" ON "PlanningMagasin"("collecteId");

-- CreateIndex
CREATE INDEX "PlanningMagasin_magasinId_idx" ON "PlanningMagasin"("magasinId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningMagasin_collecteId_magasinId_key" ON "PlanningMagasin"("collecteId", "magasinId");

-- CreateIndex
CREATE INDEX "PlanningBenevolesCentre_collecteId_idx" ON "PlanningBenevolesCentre"("collecteId");

-- CreateIndex
CREATE INDEX "PlanningBenevolesCentre_centreId_idx" ON "PlanningBenevolesCentre"("centreId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningBenevolesCentre_collecteId_centreId_key" ON "PlanningBenevolesCentre"("collecteId", "centreId");

-- CreateIndex
CREATE INDEX "PlanningChauffeur_collecteId_idx" ON "PlanningChauffeur"("collecteId");

-- CreateIndex
CREATE INDEX "PlanningChauffeur_centreId_idx" ON "PlanningChauffeur"("centreId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningChauffeur_collecteId_centreId_key" ON "PlanningChauffeur"("collecteId", "centreId");

-- CreateIndex
CREATE INDEX "Slot_centreId_idx" ON "Slot"("centreId");

-- CreateIndex
CREATE INDEX "Slot_planningMagasinId_idx" ON "Slot"("planningMagasinId");

-- CreateIndex
CREATE INDEX "Slot_planningBenevolesCentreId_idx" ON "Slot"("planningBenevolesCentreId");

-- CreateIndex
CREATE INDEX "Slot_planningChauffeurId_idx" ON "Slot"("planningChauffeurId");

-- AddForeignKey
ALTER TABLE "PlanningMagasin" ADD CONSTRAINT "PlanningMagasin_collecteId_fkey" FOREIGN KEY ("collecteId") REFERENCES "Collecte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningMagasin" ADD CONSTRAINT "PlanningMagasin_magasinId_fkey" FOREIGN KEY ("magasinId") REFERENCES "Magasin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningBenevolesCentre" ADD CONSTRAINT "PlanningBenevolesCentre_collecteId_fkey" FOREIGN KEY ("collecteId") REFERENCES "Collecte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningBenevolesCentre" ADD CONSTRAINT "PlanningBenevolesCentre_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningChauffeur" ADD CONSTRAINT "PlanningChauffeur_collecteId_fkey" FOREIGN KEY ("collecteId") REFERENCES "Collecte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningChauffeur" ADD CONSTRAINT "PlanningChauffeur_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_magasinId_fkey" FOREIGN KEY ("magasinId") REFERENCES "Magasin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_planningMagasinId_fkey" FOREIGN KEY ("planningMagasinId") REFERENCES "PlanningMagasin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_planningBenevolesCentreId_fkey" FOREIGN KEY ("planningBenevolesCentreId") REFERENCES "PlanningBenevolesCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_planningChauffeurId_fkey" FOREIGN KEY ("planningChauffeurId") REFERENCES "PlanningChauffeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
