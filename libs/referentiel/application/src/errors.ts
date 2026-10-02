// Erreurs applicatives : issues des workflows du contexte (TENETS-ERROR-003).
import type { CentreId, MagasinId } from '@rdc/referentiel-domain';

/** Un centre de même nom, adresse, code postal et ville existe déjà. */
export class CentreDejaExistant extends Error {
  readonly code = 'CENTRE_ALREADY_EXISTS';

  constructor() {
    super('Un centre avec le même nom et la même adresse existe déjà.');
    this.name = 'CentreDejaExistant';
  }
}

/** Le workflow exige un centre qui n'existe pas (TENETS-REPO-005). */
export class CentreIntrouvable extends Error {
  readonly code = 'CENTRE_NOT_FOUND';

  constructor(readonly centreId: CentreId) {
    super('Le centre demandé est introuvable.');
    this.name = 'CentreIntrouvable';
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
