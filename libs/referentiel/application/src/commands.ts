import type { NouveauCentre } from '@rdc/referentiel-domain';

/**
 * Création d'un centre : tout l'état initial sauf l'identifiant, généré par
 * le use case. Les champs sont déjà des value objects (ADR-0003, R8).
 */
export type CreerCentreCommande = Omit<NouveauCentre, 'id'>;
