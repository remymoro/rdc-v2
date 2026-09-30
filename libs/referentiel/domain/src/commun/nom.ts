import { texteObligatoire } from './texte-obligatoire';

/** Erreur métier : un nom ne peut pas être vide (TENETS-ERROR-002). */
export class NomVide extends Error {
  readonly code = 'NOM_EMPTY';

  constructor() {
    super('Le nom ne peut pas être vide');
    this.name = 'NomVide';
  }
}

/** Erreur métier : un nom ne dépasse pas 100 caractères. */
export class NomTropLong extends Error {
  readonly code = 'NOM_TOO_LONG';

  constructor(readonly longueurMaximale: number) {
    super(`Le nom ne peut pas dépasser ${longueurMaximale} caractères`);
    this.name = 'NomTropLong';
  }
}

export class Nom {
  static readonly LONGUEUR_MAXIMALE = 100;

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Nom {
    return new Nom(
      texteObligatoire(valeur, {
        longueurMaximale: Nom.LONGUEUR_MAXIMALE,
        espacesInternes: 'conserves',
        siVide: () => new NomVide(),
        siTropLong: (longueurMaximale) => new NomTropLong(longueurMaximale),
      }),
    );
  }
}
