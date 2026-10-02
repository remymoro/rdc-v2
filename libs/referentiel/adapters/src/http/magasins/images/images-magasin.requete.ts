import type {
  AjouterImageMagasinCommande,
  RetirerImageMagasinCommande,
} from '@rdc/referentiel-application';
import {
  ContenuImage,
  ImageMagasinId,
  MagasinId,
} from '@rdc/referentiel-domain';

/**
 * Fichier reçu en multipart (champ `file`, comme la v1). Seul son contenu
 * est lu : le type annoncé et le nom envoyé ne servent jamais (audit A-18).
 */
export interface FichierTeleverse {
  readonly buffer: Buffer;
  readonly mimetype?: string;
  readonly originalname?: string;
}

/** POST /api/magasins/:id/images → commande ; le domaine vérifie taille et format. */
export function versAjouterImageMagasinCommande(
  id: string,
  fichier: FichierTeleverse,
): AjouterImageMagasinCommande {
  return {
    magasinId: MagasinId.creer(id),
    contenu: ContenuImage.creer(new Uint8Array(fichier.buffer)),
  };
}

/** DELETE /api/magasins/:id/images/:imageId → commande. */
export function versRetirerImageMagasinCommande(
  id: string,
  imageId: string,
): RetirerImageMagasinCommande {
  return {
    magasinId: MagasinId.creer(id),
    imageId: ImageMagasinId.creer(imageId),
  };
}
