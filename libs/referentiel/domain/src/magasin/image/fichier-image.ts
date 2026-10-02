import { FormatImage } from './contenu-image';
import type { ImageMagasinId } from './image-magasin-id';

/** Extension du fichier stocké, déduite du format reconnu par le contenu. */
const EXTENSIONS: Readonly<Record<FormatImage, string>> = {
  [FormatImage.JPEG]: 'jpg',
  [FormatImage.PNG]: 'png',
  [FormatImage.WEBP]: 'webp',
};

/**
 * UUID (toute casse) suivi d'une extension alphanumérique : aucun séparateur
 * de chemin ni « .. » ne peut y figurer (audit A-18). L'extension reste libre
 * pour relire les images reprises de la v1, où elle venait du nom envoyé par
 * le client (ADR-0008).
 */
const FORMAT_FICHIER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/i;

/** Erreur métier : un nom de fichier d'image hors format. */
export class FichierImageInvalide extends Error {
  readonly code = 'IMAGE_FICHIER_INVALID';

  constructor() {
    super("Le nom du fichier de l'image est invalide");
    this.name = 'FichierImageInvalide';
  }
}

/**
 * Nom du fichier d'une image dans le dossier de son magasin : jamais dérivé du
 * nom envoyé par le client (RDC-REF-007, audit A-18).
 */
export class FichierImage {
  private constructor(readonly valeur: string) {}

  /** Nom d'une nouvelle image : son identifiant et l'extension de son format. */
  static pour(id: ImageMagasinId, format: FormatImage): FichierImage {
    return FichierImage.creer(`${id.valeur}.${EXTENSIONS[format]}`);
  }

  static creer(nom: string): FichierImage {
    if (!FORMAT_FICHIER.test(nom)) {
      throw new FichierImageInvalide();
    }
    return new FichierImage(nom);
  }

  equals(autre: FichierImage): boolean {
    return this.valeur === autre.valeur;
  }
}
