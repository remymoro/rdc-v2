-- Régularise les collectes restées bloquées dans le statut EN_ATTENTE_CLOTURE.
--
-- L'attente de clôture est devenue un drapeau (`Collecte.enAttenteClotureAdmin`)
-- et non plus un statut : la collecte reste EN_COURS jusqu'à l'approbation de
-- l'administrateur. Les collectes créées avant ce changement conservaient le
-- statut EN_ATTENTE_CLOTURE, que plus aucun code ne sait faire évoluer — elles
-- étaient donc impossibles à clôturer, et leurs centres ne pouvaient plus ni
-- saisir ni faire réouvrir leur saisie.
UPDATE "Collecte"
SET statut = 'EN_COURS',
    "enAttenteClotureAdmin" = true,
    "updatedAt" = NOW()
WHERE statut = 'EN_ATTENTE_CLOTURE';

-- Retire la valeur devenue morte de l'énumération (PostgreSQL impose de
-- recréer le type pour supprimer une valeur).
ALTER TYPE "StatutCollecte" RENAME TO "StatutCollecte_old";

CREATE TYPE "StatutCollecte" AS ENUM ('PREPARATION', 'EN_COURS', 'TERMINEE');

ALTER TABLE "Collecte" ALTER COLUMN statut DROP DEFAULT;

ALTER TABLE "Collecte"
  ALTER COLUMN statut TYPE "StatutCollecte"
  USING statut::text::"StatutCollecte";

ALTER TABLE "Collecte" ALTER COLUMN statut SET DEFAULT 'PREPARATION';

DROP TYPE "StatutCollecte_old";
