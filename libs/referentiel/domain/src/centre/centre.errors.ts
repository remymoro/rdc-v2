import type { CentreId } from './centre-id';

/** Un centre archivé ne peut plus changer d'état. */
export class CentreArchive extends Error {
  readonly code = 'CENTRE_ARCHIVED';

  constructor(readonly centreId: CentreId) {
    super('Ce centre est archivé : il ne peut plus être modifié.');
    this.name = 'CentreArchive';
  }
}

/** Seul un centre ACTIF reçoit un nouveau rattachement (RDC-REF-010). */
export class CentreNonActif extends Error {
  readonly code = 'CENTRE_NON_ACTIF';

  constructor(readonly centreId: CentreId) {
    super(
      "Ce centre n'est pas actif : il ne peut pas recevoir de rattachement.",
    );
    this.name = 'CentreNonActif';
  }
}
