import type { ImageMagasinId } from './image/image-magasin-id';
import type { MagasinId } from './magasin-id';

/** Le magasin a déjà une image de cet identifiant (RDC-REF-007, code v1). */
export class MagasinImageDejaPresente extends Error {
  readonly code = 'MAGASIN_IMAGE_DEJA_PRESENTE';

  constructor(readonly imageId: ImageMagasinId) {
    super('Une image avec cet identifiant existe déjà dans ce magasin.');
    this.name = 'MagasinImageDejaPresente';
  }
}

/** Le magasin n'a pas d'image de cet identifiant (RDC-REF-007, code v1). */
export class MagasinImageIntrouvable extends Error {
  readonly code = 'MAGASIN_IMAGE_INTROUVABLE';

  constructor(readonly imageId: ImageMagasinId) {
    super("L'image demandée est introuvable dans ce magasin.");
    this.name = 'MagasinImageIntrouvable';
  }
}

/** Un magasin archivé ne peut plus changer d'état (RDC-REF-002). */
export class MagasinArchive extends Error {
  readonly code = 'MAGASIN_ARCHIVED';

  constructor(readonly magasinId: MagasinId) {
    super('Ce magasin est archivé : il ne peut plus être modifié.');
    this.name = 'MagasinArchive';
  }
}
