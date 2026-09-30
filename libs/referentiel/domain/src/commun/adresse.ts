/** Erreur métier : une adresse ne peut pas être vide. */
export class AdresseVide extends Error {
  readonly code = 'ADRESSE_EMPTY';

  constructor() {
    super("L'adresse ne peut pas être vide");
    this.name = 'AdresseVide';
  }
}

/** Ligne de rue d'une adresse postale (numéro, type et nom de voie). */
export class Adresse {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Adresse {
    if (valeur.trim().length === 0) {
      throw new AdresseVide();
    }
    return new Adresse(valeur);
  }
}
