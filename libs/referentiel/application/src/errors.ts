// Erreurs applicatives : issues des workflows du contexte (TENETS-ERROR-003).
import type { CentreId, MagasinId, ProduitId } from '@rdc/referentiel-domain';

/** Le workflow exige un centre qui n'existe pas (TENETS-REPO-005). */
export class CentreIntrouvable extends Error {
  readonly code = 'CENTRE_NOT_FOUND';

  constructor(readonly centreId: CentreId) {
    super('Le centre demandé est introuvable.');
    this.name = 'CentreIntrouvable';
  }
}

/**
 * Un centre qui a encore un magasin ACTIF ou INACTIF ne s'archive pas : ses
 * magasins n'auraient plus de centre (RDC-REF-011, décision D-18).
 */
export class CentreADesMagasins extends Error {
  readonly code = 'CENTRE_A_DES_MAGASINS';

  constructor(readonly centreId: CentreId) {
    super(
      "Ce centre a encore des magasins : transférez-les ou archivez-les avant d'archiver le centre.",
    );
    this.name = 'CentreADesMagasins';
  }
}

/** Le workflow exige un magasin qui n'existe pas (TENETS-REPO-005). */
export class MagasinIntrouvable extends Error {
  readonly code = 'MAGASIN_NOT_FOUND';

  constructor(readonly magasinId: MagasinId) {
    super('Le magasin demandé est introuvable.');
    this.name = 'MagasinIntrouvable';
  }
}

/** Le workflow exige un produit qui n'existe pas (TENETS-REPO-005). */
export class ProduitIntrouvable extends Error {
  readonly code = 'PRODUIT_NOT_FOUND';

  constructor(readonly produitId: ProduitId) {
    super('Le produit demandé est introuvable.');
    this.name = 'ProduitIntrouvable';
  }
}
