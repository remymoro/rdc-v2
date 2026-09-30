import type { CentreId } from './centre-id';

/** Un centre archivé ne peut plus changer d'état. */
export class CentreArchive extends Error {
  readonly code = 'CENTRE_ARCHIVED';

  constructor(readonly centreId: CentreId) {
    super(`Le centre ${centreId.valeur} est archivé`);
    this.name = 'CentreArchive';
  }
}
