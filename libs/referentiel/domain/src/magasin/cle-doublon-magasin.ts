import {
  cleDeRapprochement,
  type IdentiteDeLieu,
} from '../commun/cle-de-rapprochement';

export type IdentiteMagasin = IdentiteDeLieu;

/**
 * Clé de rapprochement de deux magasins : même règle que le centre. Elle ne
 * contient pas le centre de rattachement, l'unicité est globale (RDC-REF-001).
 */
export class CleDoublonMagasin {
  // Rend le type nominal : une CleDoublonCentre n'est pas une CleDoublonMagasin.
  private readonly type = 'CleDoublonMagasin';

  private constructor(readonly valeur: string) {}

  static depuis(identite: IdentiteMagasin): CleDoublonMagasin {
    return new CleDoublonMagasin(cleDeRapprochement(identite));
  }

  equals(autre: CleDoublonMagasin): boolean {
    return this.valeur === autre.valeur;
  }
}
