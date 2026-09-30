-- AlterTable
ALTER TABLE "Benevole"
ADD COLUMN "anonymise"      BOOLEAN   NOT NULL DEFAULT false,
ADD COLUMN "lastActivityAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Benevole_anonymise_idx" ON "Benevole"("anonymise");
