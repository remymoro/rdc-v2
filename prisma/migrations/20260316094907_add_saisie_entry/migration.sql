/*
  Warnings:

  - You are about to drop the `LigneSaisie` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatutSaisieEntry" AS ENUM ('EN_COURS', 'VALIDEE');

-- DropForeignKey
ALTER TABLE "LigneSaisie" DROP CONSTRAINT "LigneSaisie_produitId_fkey";

-- DropForeignKey
ALTER TABLE "LigneSaisie" DROP CONSTRAINT "LigneSaisie_slotId_fkey";

-- DropTable
DROP TABLE "LigneSaisie";

-- CreateTable
CREATE TABLE "SaisieEntry" (
    "id" TEXT NOT NULL,
    "collecteId" TEXT NOT NULL,
    "magasinId" TEXT NOT NULL,
    "numeroPassage" INTEGER NOT NULL DEFAULT 1,
    "statut" "StatutSaisieEntry" NOT NULL DEFAULT 'EN_COURS',
    "totalKg" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaisieEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaisieEntryItem" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "produitRef" TEXT NOT NULL,
    "famille" TEXT NOT NULL,
    "sousFamille" TEXT NOT NULL,
    "poidsKg" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "SaisieEntryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaisieEntry_collecteId_magasinId_idx" ON "SaisieEntry"("collecteId", "magasinId");

-- CreateIndex
CREATE INDEX "SaisieEntry_statut_idx" ON "SaisieEntry"("statut");

-- CreateIndex
CREATE INDEX "SaisieEntryItem_entryId_idx" ON "SaisieEntryItem"("entryId");

-- AddForeignKey
ALTER TABLE "SaisieEntry" ADD CONSTRAINT "SaisieEntry_collecteId_fkey" FOREIGN KEY ("collecteId") REFERENCES "Collecte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaisieEntry" ADD CONSTRAINT "SaisieEntry_magasinId_fkey" FOREIGN KEY ("magasinId") REFERENCES "Magasin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaisieEntryItem" ADD CONSTRAINT "SaisieEntryItem_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "SaisieEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
