CREATE TYPE "StatutSaisieCentre" AS ENUM (
  'EN_COURS',
  'TERMINEE_PAR_CENTRE',
  'REOUVERTE_PAR_ADMIN'
);

ALTER TABLE "CollecteCentreSaisie"
  ADD COLUMN "statut" "StatutSaisieCentre" NOT NULL DEFAULT 'EN_COURS',
  ADD COLUMN "rouverteAt" TIMESTAMP(3),
  ADD COLUMN "rouverteParUserId" TEXT,
  ADD COLUMN "raisonReouverture" TEXT;

UPDATE "CollecteCentreSaisie"
SET "statut" = CASE
  WHEN "saisieTerminee" = true THEN 'TERMINEE_PAR_CENTRE'::"StatutSaisieCentre"
  ELSE 'EN_COURS'::"StatutSaisieCentre"
END;

CREATE INDEX "CollecteCentreSaisie_statut_idx" ON "CollecteCentreSaisie"("statut");
