ALTER TABLE "ParticipationMagasin" ADD COLUMN "centreId" TEXT;

UPDATE "ParticipationMagasin" AS p
SET "centreId" = m."centreId"
FROM "Magasin" AS m
WHERE p."magasinId" = m.id;

ALTER TABLE "ParticipationMagasin" ALTER COLUMN "centreId" SET NOT NULL;

CREATE INDEX "ParticipationMagasin_centreId_idx" ON "ParticipationMagasin"("centreId");

ALTER TABLE "ParticipationMagasin"
ADD CONSTRAINT "ParticipationMagasin_centreId_fkey"
FOREIGN KEY ("centreId") REFERENCES "Centre"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
