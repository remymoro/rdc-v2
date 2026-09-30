-- CreateEnum
CREATE TYPE "TypeEngagement" AS ENUM ('PONCTUEL', 'REGULIER');

-- AlterTable
ALTER TABLE "Benevole"
ADD COLUMN "typeEngagement" "TypeEngagement" NOT NULL DEFAULT 'PONCTUEL';

-- CreateIndex
CREATE INDEX "Benevole_typeEngagement_idx" ON "Benevole"("typeEngagement");
