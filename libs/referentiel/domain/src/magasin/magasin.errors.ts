import type { MagasinId } from './magasin-id';

/** Un magasin archivé ne peut plus changer d'état (RDC-REF-002). */
export class MagasinArchive extends Error {
  readonly code = 'MAGASIN_ARCHIVED';

  constructor(readonly magasinId: MagasinId) {
    super('Ce magasin est archivé : il ne peut plus être modifié.');
    this.name = 'MagasinArchive';
  }
}
