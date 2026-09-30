-- AlterTable
ALTER TABLE "Centre" ADD COLUMN     "cleDoublon" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Centre_cleDoublon_key" ON "Centre"("cleDoublon");

