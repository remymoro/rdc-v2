import { texteObligatoire } from '../commun/texte-obligatoire';

const LONGUEUR_MAXIMALE = 100;

/** Erreur métier : la famille d'un produit est obligatoire. */
export class FamilleVide extends Error {
  readonly code = 'FAMILLE_EMPTY';

  constructor() {
    super('La famille du produit est obligatoire');
    this.name = 'FamilleVide';
  }
}

/** Erreur métier : une famille ne dépasse pas 100 caractères. */
export class FamilleTropLongue extends Error {
  readonly code = 'FAMILLE_TOO_LONG';

  constructor(readonly longueurMaximale: number) {
    super(`La famille ne peut pas dépasser ${longueurMaximale} caractères`);
    this.name = 'FamilleTropLongue';
  }
}

/** Erreur métier : la sous-famille d'un produit est obligatoire. */
export class SousFamilleVide extends Error {
  readonly code = 'SOUS_FAMILLE_EMPTY';

  constructor() {
    super('La sous-famille du produit est obligatoire');
    this.name = 'SousFamilleVide';
  }
}

/** Erreur métier : une sous-famille ne dépasse pas 100 caractères. */
export class SousFamilleTropLongue extends Error {
  readonly code = 'SOUS_FAMILLE_TOO_LONG';

  constructor(readonly longueurMaximale: number) {
    super(
      `La sous-famille ne peut pas dépasser ${longueurMaximale} caractères`,
    );
    this.name = 'SousFamilleTropLongue';
  }
}

/** Classement d'un produit, utilisé par les statistiques (glossaire). */
export class Famille {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Famille {
    return new Famille(
      texteObligatoire(valeur, {
        longueurMaximale: LONGUEUR_MAXIMALE,
        espacesInternes: 'reduits',
        siVide: () => new FamilleVide(),
        siTropLong: (max) => new FamilleTropLongue(max),
      }),
    );
  }
}

/** Sous-classement d'un produit au sein de sa famille. */
export class SousFamille {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): SousFamille {
    return new SousFamille(
      texteObligatoire(valeur, {
        longueurMaximale: LONGUEUR_MAXIMALE,
        espacesInternes: 'reduits',
        siVide: () => new SousFamilleVide(),
        siTropLong: (max) => new SousFamilleTropLongue(max),
      }),
    );
  }
}
