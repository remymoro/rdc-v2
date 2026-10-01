import type { CentreId } from './centre-id';

/** Un centre archivé ne peut plus changer d'état. */
export class CentreArchive extends Error {
  readonly code = 'CENTRE_ARCHIVED';

  constructor(readonly centreId: CentreId) {
    super('Ce centre est archivé : il ne peut plus être modifié.');
    this.name = 'CentreArchive';
  }
}
