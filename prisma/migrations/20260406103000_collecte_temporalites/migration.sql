ALTER TABLE "Collecte"
ADD COLUMN "planificationBenevolesOuverte" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "saisieOuverte" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Collecte"
SET "planificationBenevolesOuverte" = true
WHERE "statut" = 'INSCRIPTIONS_OUVERTES';

UPDATE "Collecte"
SET "statut" = 'PREPARATION'
WHERE "statut" IN ('INSCRIPTIONS_OUVERTES', 'INSCRIPTIONS_FERMEES');

UPDATE "Collecte"
SET "saisieOuverte" = true
WHERE "statut" = 'SAISIE_EN_COURS';
