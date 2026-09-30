/** Erreur métier : un nom ne peut pas être vide (TENETS-ERROR-002). */
export class NomVide extends Error {
  readonly code = 'NOM_EMPTY';

  constructor() {
    super('Le nom ne peut pas être vide');
    this.name = 'NomVide';
  }
}

export class Nom {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Nom {
    if (valeur.trim().length === 0) {
      throw new NomVide();
    }
    return new Nom(valeur);
  }
}
