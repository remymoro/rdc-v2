/** Erreur métier : une ville ne peut pas être vide. */
export class VilleVide extends Error {
  readonly code = 'VILLE_EMPTY';

  constructor() {
    super('La ville ne peut pas être vide');
    this.name = 'VilleVide';
  }
}

/** Erreur métier : une ville ne dépasse pas 100 caractères. */
export class VilleTropLongue extends Error {
  readonly code = 'VILLE_TOO_LONG';

  constructor(readonly longueurMaximale: number) {
    super(`La ville ne peut pas dépasser ${longueurMaximale} caractères`);
    this.name = 'VilleTropLongue';
  }
}

export class Ville {
  static readonly LONGUEUR_MAXIMALE = 100;

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Ville {
    const ville = valeur.trim();
    if (ville.length === 0) {
      throw new VilleVide();
    }
    if (ville.length > Ville.LONGUEUR_MAXIMALE) {
      throw new VilleTropLongue(Ville.LONGUEUR_MAXIMALE);
    }
    return new Ville(ville);
  }
}
