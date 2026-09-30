-- Rename TypeEngagement enum values without data loss.
ALTER TYPE "TypeEngagement" RENAME VALUE 'PONCTUEL' TO 'BNV_Restos';
ALTER TYPE "TypeEngagement" RENAME VALUE 'REGULIER' TO 'BNV_1_jour';

-- Ensure default uses the new enum value.
ALTER TABLE "Benevole"
ALTER COLUMN "typeEngagement" SET DEFAULT 'BNV_Restos';
