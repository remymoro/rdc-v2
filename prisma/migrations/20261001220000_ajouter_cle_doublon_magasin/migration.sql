-- AlterTable
ALTER TABLE "Magasin" ADD COLUMN     "cleDoublon" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Magasin_cleDoublon_key" ON "Magasin"("cleDoublon");

