import type {
  CentreId,
  MagasinId,
  StatutMagasin,
} from '@rdc/referentiel-domain';

/**
 * Vue d'un magasin pour la lecture : une projection en lecture seule, pas
 * l'agrégat (aucun comportement, aucun invariant à protéger).
 */
export interface VueMagasin {
  readonly id: string;
  readonly nom: string;
  readonly adresse: string;
  readonly codePostal: string;
  readonly ville: string;
  readonly telephone?: string;
  readonly email?: string;
  readonly statut: StatutMagasin;
  readonly centreId: string;
  readonly creeLe: Date;
  readonly modifieLe: Date;
}

/**
 * Port de lecture des magasins (TENETS-PORT-002) : les lectures passent par
 * des requêtes dédiées, pas par le repository de l'agrégat. Listes triées par
 * nom ; archivés compris.
 */
export abstract class LecturesMagasins {
  abstract list(): Promise<readonly VueMagasin[]>;

  abstract listByCentre(centreId: CentreId): Promise<readonly VueMagasin[]>;

  /** La vue du magasin, ou null s'il n'existe pas (TENETS-REPO-005). */
  abstract get(id: MagasinId): Promise<VueMagasin | null>;
}
