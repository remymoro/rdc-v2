import type { VueImageMagasin, VueMagasin } from '@rdc/referentiel-application';
import type { ImageMagasin, Magasin, MagasinId } from '@rdc/referentiel-domain';
import { PREFIXE_PUBLIC_IMAGES } from '../../../stockage/configuration-images';

/** Contrat MagasinImageDto de RDC v1 (ADR-0009). */
export interface ImageMagasinReponse {
  id: string;
  /** URL publique, servie par nginx (ou l'API en développement). */
  url: string;
  ordre: number;
  createdAt: string;
}

/**
 * Contrat de réponse MagasinDto de RDC v1 (ADR-0009). Forme reprise du
 * CentreDto, plus le centre de rattachement et les images : à confronter au
 * mapper v1 (`presentation/http/mappers/magasin.mapper.ts`).
 */
export interface MagasinReponse {
  id: string;
  nom: string;
  ville: string;
  codePostal: string;
  adresse: string;
  telephone?: string;
  email?: string;
  statut: 'ACTIF' | 'INACTIF' | 'ARCHIVE';
  centreId: string;
  /** Images dans leur ordre d'affichage (RDC-REF-007). */
  images: ImageMagasinReponse[];
  createdAt: string;
  updatedAt: string;
}

/** Magasin du domaine → réponse HTTP explicite (TENETS-API-003). */
export function versMagasinReponse(magasin: Magasin): MagasinReponse {
  return vueVersMagasinReponse({
    id: magasin.id.valeur,
    nom: magasin.nom.valeur,
    adresse: magasin.adresse.valeur,
    codePostal: magasin.codePostal.valeur,
    ville: magasin.ville.valeur,
    ...(magasin.telephone && { telephone: magasin.telephone.valeur }),
    ...(magasin.email && { email: magasin.email.valeur }),
    statut: magasin.statut,
    centreId: magasin.centreId.valeur,
    images: magasin.images.map(versVueImage),
    creeLe: magasin.creeLe,
    modifieLe: magasin.modifieLe,
  });
}

/** Vue de lecture → même réponse MagasinDto (lectures du lot A4). */
export function vueVersMagasinReponse(vue: VueMagasin): MagasinReponse {
  return {
    id: vue.id,
    nom: vue.nom,
    ville: vue.ville,
    codePostal: vue.codePostal,
    adresse: vue.adresse,
    ...(vue.telephone !== undefined && { telephone: vue.telephone }),
    ...(vue.email !== undefined && { email: vue.email }),
    statut: vue.statut,
    centreId: vue.centreId,
    images: vue.images.map((image) => vueVersImageReponse(vue.id, image)),
    createdAt: vue.creeLe.toISOString(),
    updatedAt: vue.modifieLe.toISOString(),
  };
}

/** Image ajoutée → réponse 201 de POST /api/magasins/:id/images (v1). */
export function versImageMagasinReponse(
  magasinId: MagasinId,
  image: ImageMagasin,
): ImageMagasinReponse {
  return vueVersImageReponse(magasinId.valeur, versVueImage(image));
}

function versVueImage(image: ImageMagasin): VueImageMagasin {
  return {
    id: image.id.valeur,
    fichier: image.fichier.valeur,
    ordre: image.ordre,
    ajouteeLe: image.ajouteeLe,
  };
}

/** L'URL publique suit l'arborescence du dossier des images, comme en v1. */
function vueVersImageReponse(
  magasinId: string,
  image: VueImageMagasin,
): ImageMagasinReponse {
  return {
    id: image.id,
    url: `${PREFIXE_PUBLIC_IMAGES}/magasins/${magasinId}/${image.fichier}`,
    ordre: image.ordre,
    createdAt: image.ajouteeLe.toISOString(),
  };
}
