import { FORMAT_UUID } from '../../commun/format-uuid';

/** Erreur métier : l'identifiant d'une image est obligatoire. */
export class ImageMagasinIdVide extends Error {
  readonly code = 'IMAGE_ID_EMPTY';

  constructor() {
    super("L'identifiant de l'image est obligatoire");
    this.name = 'ImageMagasinIdVide';
  }
}

/** Erreur métier : l'identifiant d'une image est un UUID. */
export class ImageMagasinIdInvalide extends Error {
  readonly code = 'IMAGE_ID_INVALID';

  constructor() {
    super("L'identifiant de l'image est invalide");
    this.name = 'ImageMagasinIdInvalide';
  }
}

/** Identité d'une image d'un magasin (RDC-REF-007). */
export class ImageMagasinId {
  // Rend le type nominal : un MagasinId de même forme n'est pas un ImageMagasinId.
  private readonly type = 'ImageMagasinId';

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): ImageMagasinId {
    const identifiant = valeur.trim().toLowerCase();
    if (identifiant.length === 0) {
      throw new ImageMagasinIdVide();
    }
    if (!FORMAT_UUID.test(identifiant)) {
      throw new ImageMagasinIdInvalide();
    }
    return new ImageMagasinId(identifiant);
  }

  equals(autre: ImageMagasinId): boolean {
    return this.valeur === autre.valeur;
  }
}
