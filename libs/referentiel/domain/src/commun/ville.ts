/** Erreur métier : une ville ne peut pas être vide. */
export class VilleVide extends Error {
  readonly code = 'VILLE_EMPTY';

  constructor() {
    super('La ville ne peut pas être vide');
    this.name = 'VilleVide';
  }
}

export class Ville {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Ville {
    if (valeur.trim().length === 0) {
      throw new VilleVide();
    }
    return new Ville(valeur);
  }
}
