/*
  Warnings:

  - You are about to drop the column `benevoleEmail` on the `Slot` table. All the data in the column will be lost.
  - You are about to drop the column `benevoleNom` on the `Slot` table. All the data in the column will be lost.
  - You are about to drop the column `benevolePrenom` on the `Slot` table. All the data in the column will be lost.
  - You are about to drop the column `benevoleTel` on the `Slot` table. All the data in the column will be lost.
  - Added the required column `benevoleId` to the `Slot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Slot" DROP COLUMN "benevoleEmail",
DROP COLUMN "benevoleNom",
DROP COLUMN "benevolePrenom",
DROP COLUMN "benevoleTel",
ADD COLUMN     "benevoleId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Benevole" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "tel" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Benevole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Benevole_nom_prenom_idx" ON "Benevole"("nom", "prenom");

-- CreateIndex
CREATE UNIQUE INDEX "Benevole_email_key" ON "Benevole"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Benevole_tel_key" ON "Benevole"("tel");

-- CreateIndex
CREATE INDEX "Slot_benevoleId_idx" ON "Slot"("benevoleId");

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_benevoleId_fkey" FOREIGN KEY ("benevoleId") REFERENCES "Benevole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
