import type { CentreId, StatutCentre } from '@rdc/referentiel-domain';

/** Magasins rattachés à un centre, archivés exclus (RDC-REF-011). */
export interface MagasinsDuCentre {
  readonly actifs: number;
  readonly inactifs: number;
}

/**
 * Vue d'un centre pour la lecture : une projection en lecture seule, pas
 * l'agrégat (aucun comportement, aucun invariant à protéger).
 */
export interface VueCentre {
  readonly id: string;
  readonly nom: string;
  readonly adresse: string;
  readonly codePostal: string;
  readonly ville: string;
  readonly telephone?: string;
  readonly email?: string;
  readonly statut: StatutCentre;
  readonly magasins: MagasinsDuCentre;
  readonly creeLe: Date;
  readonly modifieLe: Date;
}

/** Critères de la liste ; un critère absent ne filtre pas. */
export interface FiltreCentres {
  readonly statut?: StatutCentre;
  /**
   * Texte cherché dans le nom ou la ville, sans tenir compte de la casse.
   * Déjà nettoyé par la requête applicative : jamais vide.
   */
  readonly recherche?: string;
}

/**
 * Port de lecture des centres (TENETS-PORT-002) : les lectures passent par
 * des requêtes dédiées, pas par le repository de l'agrégat. Listes triées par
 * nom ; archivés compris quand aucun statut n'est demandé.
 */
export abstract class LecturesCentres {
  abstract list(filtre: FiltreCentres): Promise<readonly VueCentre[]>;

  /** La vue du centre, ou null s'il n'existe pas (TENETS-REPO-005). */
  abstract get(id: CentreId): Promise<VueCentre | null>;
}
