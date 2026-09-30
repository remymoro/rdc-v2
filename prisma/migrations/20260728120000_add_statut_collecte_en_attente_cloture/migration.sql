-- Ajoute le statut intermédiaire EN_ATTENTE_CLOTURE au cycle de vie des collectes.
-- La collecte n'est plus clôturée automatiquement : elle passe d'abord en attente
-- d'une autorisation explicite de l'administrateur avant de devenir TERMINEE.
ALTER TYPE "StatutCollecte" ADD VALUE IF NOT EXISTS 'EN_ATTENTE_CLOTURE' BEFORE 'TERMINEE';
