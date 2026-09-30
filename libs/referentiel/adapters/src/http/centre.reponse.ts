import type { Centre } from '@rdc/referentiel-domain';

/** Contrat de réponse repris de RDC v1 (CentreDto) : le front l'utilise tel quel. */
export interface CentreReponse {
  id: string;
  nom: string;
  ville: string;
  codePostal: string;
  adresse: string;
  telephone?: string;
  email?: string;
  statut: 'ACTIF' | 'INACTIF' | 'ARCHIVE';
  /** Géré par le contexte identité-accès (étape 4) : 0 à la création. */
  responsablesCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Centre du domaine → réponse HTTP explicite (TENETS-API-003). */
export function versCentreReponse(centre: Centre): CentreReponse {
  return {
    id: centre.id.valeur,
    nom: centre.nom.valeur,
    ville: centre.ville.valeur,
    codePostal: centre.codePostal.valeur,
    adresse: centre.adresse.valeur,
    ...(centre.telephone && { telephone: centre.telephone.valeur }),
    ...(centre.email && { email: centre.email.valeur }),
    statut: centre.statut,
    responsablesCount: 0,
    createdAt: centre.creeLe.toISOString(),
    updatedAt: centre.modifieLe.toISOString(),
  };
}
