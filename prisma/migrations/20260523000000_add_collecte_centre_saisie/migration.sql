CREATE TABLE "CollecteCentreSaisie" (
  "collecteId" TEXT NOT NULL,
  "centreId" TEXT NOT NULL,
  "saisieTerminee" BOOLEAN NOT NULL DEFAULT false,
  "termineeAt" TIMESTAMP(3),
  "termineeParUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CollecteCentreSaisie_pkey" PRIMARY KEY ("collecteId", "centreId")
);

CREATE INDEX "CollecteCentreSaisie_collecteId_idx" ON "CollecteCentreSaisie"("collecteId");
CREATE INDEX "CollecteCentreSaisie_centreId_idx" ON "CollecteCentreSaisie"("centreId");
CREATE INDEX "CollecteCentreSaisie_saisieTerminee_idx" ON "CollecteCentreSaisie"("saisieTerminee");

ALTER TABLE "CollecteCentreSaisie"
ADD CONSTRAINT "CollecteCentreSaisie_collecteId_fkey"
FOREIGN KEY ("collecteId") REFERENCES "Collecte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CollecteCentreSaisie"
ADD CONSTRAINT "CollecteCentreSaisie_centreId_fkey"
FOREIGN KEY ("centreId") REFERENCES "Centre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
