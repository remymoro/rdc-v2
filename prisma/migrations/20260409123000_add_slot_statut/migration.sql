-- Add statut to Slot
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatutSlot') THEN
    CREATE TYPE "StatutSlot" AS ENUM ('PLANIFIE', 'ANNULE');
  END IF;
END$$;

ALTER TABLE "Slot" ADD COLUMN IF NOT EXISTS "statut" "StatutSlot" NOT NULL DEFAULT 'PLANIFIE';
