-- Migration : suppression de SAISIE_EN_COURS et StatutParticipation
-- Données : SAISIE_EN_COURS → EN_COURS, colonne statut retirée des participations

-- 1. Migrer les collectes avec statuts supprimés vers les statuts restants
UPDATE "Collecte"
SET "statut" = CASE
	WHEN "statut" = 'SAISIE_EN_COURS' THEN 'EN_COURS'
	WHEN "statut" IN ('INSCRIPTIONS_OUVERTES', 'INSCRIPTIONS_FERMEES') THEN 'PREPARATION'
	ELSE "statut"
END
WHERE "statut" IN ('SAISIE_EN_COURS', 'INSCRIPTIONS_OUVERTES', 'INSCRIPTIONS_FERMEES');

-- 2. Supprimer la colonne statut de ParticipationMagasin
ALTER TABLE "ParticipationMagasin" DROP COLUMN IF EXISTS "statut";

-- 3. Supprimer l'enum StatutParticipation (devenu inutile)
DROP TYPE IF EXISTS "StatutParticipation";

-- 4. Supprimer SAISIE_EN_COURS de l'enum StatutCollecte
-- (PostgreSQL ne permet pas DROP VALUE directement, on recrée l'enum)
ALTER TYPE "StatutCollecte" RENAME TO "StatutCollecte_old";
CREATE TYPE "StatutCollecte" AS ENUM ('PREPARATION', 'EN_COURS', 'TERMINEE');
ALTER TABLE "Collecte" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "Collecte" ALTER COLUMN "statut" TYPE "StatutCollecte" USING "statut"::text::"StatutCollecte";
ALTER TABLE "Collecte" ALTER COLUMN "statut" SET DEFAULT 'PREPARATION';
DROP TYPE "StatutCollecte_old";
