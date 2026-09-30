/*
  Warnings:

  - The primary key for the `LigneSaisie` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `produitCode` on the `LigneSaisie` table. All the data in the column will be lost.
  - The primary key for the `Produit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[code]` on the table `Produit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `produitId` to the `LigneSaisie` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Produit` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "LigneSaisie" DROP CONSTRAINT "LigneSaisie_produitCode_fkey";

-- AlterTable
ALTER TABLE "LigneSaisie" DROP CONSTRAINT "LigneSaisie_pkey",
DROP COLUMN "produitCode",
ADD COLUMN     "produitId" TEXT NOT NULL,
ADD CONSTRAINT "LigneSaisie_pkey" PRIMARY KEY ("slotId", "produitId");

-- AlterTable
ALTER TABLE "Produit" DROP CONSTRAINT "Produit_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Produit_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Produit_code_key" ON "Produit"("code");

-- AddForeignKey
ALTER TABLE "LigneSaisie" ADD CONSTRAINT "LigneSaisie_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
