import { texteObligatoire } from './texte-obligatoire';

/** Erreur métier : une adresse ne peut pas être vide. */
export class AdresseVide extends Error {
  readonly code = 'ADRESSE_EMPTY';

  constructor() {
    super("L'adresse ne peut pas être vide");
    this.name = 'AdresseVide';
  }
}

/** Erreur métier : une adresse ne dépasse pas 255 caractères. */
export class AdresseTropLongue extends Error {
  readonly code = 'ADRESSE_TOO_LONG';

  constructor(readonly longueurMaximale: number) {
    super(`L'adresse ne peut pas dépasser ${longueurMaximale} caractères`);
    this.name = 'AdresseTropLongue';
  }
}

/** Ligne de rue d'une adresse postale (numéro, type et nom de voie). */
export class Adresse {
  static readonly LONGUEUR_MAXIMALE = 255;

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Adresse {
    return new Adresse(
      texteObligatoire(valeur, {
        longueurMaximale: Adresse.LONGUEUR_MAXIMALE,
        espacesInternes: 'reduits',
        siVide: () => new AdresseVide(),
        siTropLong: (longueurMaximale) =>
          new AdresseTropLongue(longueurMaximale),
      }),
    );
  }
}
