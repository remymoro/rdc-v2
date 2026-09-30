-- Attach volunteers to centres while keeping existing historical rows nullable.
ALTER TABLE "Benevole" ADD COLUMN "centreId" TEXT;

DROP INDEX IF EXISTS "Benevole_email_key";
DROP INDEX IF EXISTS "Benevole_tel_key";

CREATE UNIQUE INDEX "Benevole_centreId_email_key" ON "Benevole"("centreId", "email");
CREATE UNIQUE INDEX "Benevole_centreId_tel_key" ON "Benevole"("centreId", "tel");
CREATE INDEX "Benevole_centreId_idx" ON "Benevole"("centreId");

ALTER TABLE "Benevole"
  ADD CONSTRAINT "Benevole_centreId_fkey"
  FOREIGN KEY ("centreId") REFERENCES "Centre"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
