/** Vue d'un produit du catalogue, en lecture seule. */
export interface VueProduit {
  readonly id: string;
  readonly code: string;
  readonly famille: string;
  readonly sousFamille: string;
  readonly actif: boolean;
  readonly creeLe: Date;
  readonly modifieLe: Date;
}

/**
 * Port de lecture du catalogue (TENETS-PORT-002) : tous les produits, triés
 * par code, inactifs compris (le front filtre sur `actif`).
 */
export abstract class LecturesProduits {
  abstract list(): Promise<readonly VueProduit[]>;
}
