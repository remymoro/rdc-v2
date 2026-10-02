import type {
  CentreId,
  ContenuImage,
  ImageMagasinId,
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

/**
 * Ajout d'une image (RDC-REF-007) : le contenu est déjà vérifié (taille,
 * format reconnu par la signature) ; le nom envoyé par le client n'y figure pas.
 */
export interface AjouterImageMagasinCommande {
  readonly magasinId: MagasinId;
  readonly contenu: ContenuImage;
}

/** Retrait d'une image d'un magasin (RDC-REF-007). */
export interface RetirerImageMagasinCommande {
  readonly magasinId: MagasinId;
  readonly imageId: ImageMagasinId;
}
