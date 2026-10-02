import type { VueMagasin } from '@rdc/referentiel-application';
import type { Magasin } from '@rdc/referentiel-domain';

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
  /** Gérées par le lot C : toujours vides d'ici là. */
  images: never[];
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
    images: [],
    createdAt: vue.creeLe.toISOString(),
    updatedAt: vue.modifieLe.toISOString(),
  };
}
