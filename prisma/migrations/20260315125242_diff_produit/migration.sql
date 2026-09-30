/*
  Warnings:

  - You are about to drop the column `nom` on the `Produit` table. All the data in the column will be lost.
  - Added the required column `sousFamille` to the `Produit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Produit" DROP COLUMN "nom",
ADD COLUMN     "sousFamille" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Produit_famille_idx" ON "Produit"("famille");
