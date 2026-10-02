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
  return {
    id: magasin.id.valeur,
    nom: magasin.nom.valeur,
    ville: magasin.ville.valeur,
    codePostal: magasin.codePostal.valeur,
    adresse: magasin.adresse.valeur,
    ...(magasin.telephone && { telephone: magasin.telephone.valeur }),
    ...(magasin.email && { email: magasin.email.valeur }),
    statut: magasin.statut,
    centreId: magasin.centreId.valeur,
    images: [],
    createdAt: magasin.creeLe.toISOString(),
    updatedAt: magasin.modifieLe.toISOString(),
  };
}
