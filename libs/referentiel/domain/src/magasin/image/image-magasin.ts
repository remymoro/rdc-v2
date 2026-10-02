import type { FichierImage } from './fichier-image';
import type { ImageMagasinId } from './image-magasin-id';

/** Erreur métier : la position d'une image est un entier positif ou nul. */
export class OrdreImageInvalide extends Error {
  readonly code = 'IMAGE_ORDRE_INVALID';

  constructor() {
    super("La position de l'image est invalide");
    this.name = 'OrdreImageInvalide';
  }
}

/** Ce que l'agrégat Magasin reçoit pour ajouter une image. */
export interface NouvelleImageMagasin {
  readonly id: ImageMagasinId;
  readonly fichier: FichierImage;
}

/** État persisté complet d'une image (TENETS-LIFECYCLE-005). */
export interface EtatImageMagasin extends NouvelleImageMagasin {
  /** Position dans la liste des images du magasin (0 = la première). */
  readonly ordre: number;
  readonly ajouteeLe: Date;
}

/**
 * Image d'un magasin (RDC-REF-007) : entité interne de l'agrégat Magasin, qui
 * seul la crée ou la retire (TENETS-AGGREGATE-001). Immuable une fois ajoutée.
 */
export class ImageMagasin {
  private constructor(
    readonly id: ImageMagasinId,
    readonly fichier: FichierImage,
    readonly ordre: number,
    readonly ajouteeLe: Date,
  ) {
    if (!Number.isInteger(ordre) || ordre < 0) {
      throw new OrdreImageInvalide();
    }
  }

  /** Réservé à l'agrégat Magasin, qui décide de la position. */
  static creer(
    nouvelle: NouvelleImageMagasin,
    ordre: number,
    maintenant: Date,
  ): ImageMagasin {
    return new ImageMagasin(nouvelle.id, nouvelle.fichier, ordre, maintenant);
  }

  static reconstituer(etat: EtatImageMagasin): ImageMagasin {
    return new ImageMagasin(etat.id, etat.fichier, etat.ordre, etat.ajouteeLe);
  }

  /** Deux images sont la même si elles ont la même identité (TENETS-ENTITY-001). */
  equals(autre: ImageMagasin): boolean {
    return this.id.equals(autre.id);
  }
}
