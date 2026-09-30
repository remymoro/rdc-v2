import type { Adresse } from '../commun/adresse';
import type { CodePostal } from '../commun/code-postal';
import type { Nom } from '../commun/nom';
import type { Ville } from '../commun/ville';

export interface IdentiteCentre {
  readonly nom: Nom;
  readonly adresse: Adresse;
  readonly codePostal: CodePostal;
  readonly ville: Ville;
}

/**
 * Clé de rapprochement de deux centres (règle de RDC v1) : plus tolérante que
 * les value objects, elle ignore accents, casse, apostrophes, tirets, points
 * et espaces. Deux centres de même clé sont des doublons.
 */
export class CleDoublonCentre {
  private constructor(readonly valeur: string) {}

  static depuis(identite: IdentiteCentre): CleDoublonCentre {
    return new CleDoublonCentre(
      [
        compacter(identite.nom.valeur),
        compacter(identite.ville.valeur),
        identite.codePostal.valeur,
        compacter(identite.adresse.valeur),
      ].join('|'),
    );
  }

  equals(autre: CleDoublonCentre): boolean {
    return this.valeur === autre.valeur;
  }
}

/** Sans accents, en majuscules, sans apostrophes, tirets, points ni espaces. */
function compacter(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019\-_.\s]/g, '')
    .toLocaleUpperCase('fr-FR');
}
