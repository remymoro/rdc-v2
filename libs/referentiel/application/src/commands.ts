import type { CentreId, NouveauCentre } from '@rdc/referentiel-domain';

/**
 * Création d'un centre : tout l'état initial sauf l'identifiant, généré par
 * le use case. Les champs sont déjà des value objects (ADR-0003, R8).
 */
export type CreerCentreCommande = Omit<NouveauCentre, 'id'>;

/** Désactivation d'un centre : l'identifiant arrive déjà typé (ADR-0003, R8). */
export interface DesactiverCentreCommande {
  readonly centreId: CentreId;
}

/** Réactivation d'un centre désactivé. */
export interface ActiverCentreCommande {
  readonly centreId: CentreId;
}

/** Archivage définitif d'un centre. */
export interface ArchiverCentreCommande {
  readonly centreId: CentreId;
}
