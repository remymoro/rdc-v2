import type { Adresse } from './adresse';
import type { CodePostal } from './code-postal';
import type { Nom } from './nom';
import type { Ville } from './ville';

/** Ce qui identifie un lieu (centre ou magasin) pour repérer un doublon. */
export interface IdentiteDeLieu {
  readonly nom: Nom;
  readonly adresse: Adresse;
  readonly codePostal: CodePostal;
  readonly ville: Ville;
}

/**
 * Règle de rapprochement de RDC v1 : plus tolérante que les value objects,
 * elle ignore accents, casse, apostrophes, tirets, points et espaces.
 */
export function cleDeRapprochement(identite: IdentiteDeLieu): string {
  return [
    compacter(identite.nom.valeur),
    compacter(identite.ville.valeur),
    identite.codePostal.valeur,
    compacter(identite.adresse.valeur),
  ].join('|');
}

/** Sans accents, en majuscules, sans apostrophes, tirets, points ni espaces. */
function compacter(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’\-_.\s]/g, '')
    .toLocaleUpperCase('fr-FR');
}
