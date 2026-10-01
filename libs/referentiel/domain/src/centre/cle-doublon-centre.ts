import {
  cleDeRapprochement,
  type IdentiteDeLieu,
} from '../commun/cle-de-rapprochement';

export type IdentiteCentre = IdentiteDeLieu;

/**
 * Clé de rapprochement de deux centres (règle de RDC v1, voir
 * `cleDeRapprochement`). Deux centres de même clé sont des doublons.
 */
export class CleDoublonCentre {
  private constructor(readonly valeur: string) {}

  static depuis(identite: IdentiteCentre): CleDoublonCentre {
    return new CleDoublonCentre(cleDeRapprochement(identite));
  }

  equals(autre: CleDoublonCentre): boolean {
    return this.valeur === autre.valeur;
  }
}
