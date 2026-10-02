import type { NouveauMagasin } from '@rdc/referentiel-domain';

/**
 * Création d'un magasin dans un centre : tout l'état initial sauf
 * l'identifiant, généré par le use case (ADR-0003, R8).
 */
export type CreerMagasinCommande = Omit<NouveauMagasin, 'id'>;
