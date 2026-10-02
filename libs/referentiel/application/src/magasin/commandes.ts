import type {
  CentreId,
  MagasinId,
  ModificationsMagasin,
  NouveauMagasin,
} from '@rdc/referentiel-domain';

/**
 * Création d'un magasin dans un centre : tout l'état initial sauf
 * l'identifiant, généré par le use case (ADR-0003, R8).
 */
export type CreerMagasinCommande = Omit<NouveauMagasin, 'id'>;

/** Désactivation d'un magasin : l'identifiant arrive déjà typé (ADR-0003, R8). */
export interface DesactiverMagasinCommande {
  readonly magasinId: MagasinId;
}

/** Réactivation d'un magasin désactivé. */
export interface ActiverMagasinCommande {
  readonly magasinId: MagasinId;
}

/** Archivage définitif d'un magasin. */
export interface ArchiverMagasinCommande {
  readonly magasinId: MagasinId;
}

/**
 * Modification d'un magasin (PATCH v1) : changements de l'identité et des
 * contacts, et transfert éventuel vers un autre centre (RDC-REF-005).
 */
export interface ModifierMagasinCommande {
  readonly magasinId: MagasinId;
  readonly changements: ModificationsMagasin;
  /** Absent = pas de transfert ; identique au centre actuel = sans effet. */
  readonly centreId?: CentreId;
}
