/** Erreur métier : un téléphone renseigné ne peut pas être vide. */
export class TelephoneVide extends Error {
  readonly code = 'TELEPHONE_EMPTY';

  constructor() {
    super('Le téléphone ne peut pas être vide');
    this.name = 'TelephoneVide';
  }
}

export class Telephone {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Telephone {
    if (valeur.trim().length === 0) {
      throw new TelephoneVide();
    }
    return new Telephone(valeur);
  }
}
