const CINQ_CHIFFRES = /^\d{5}$/;

/** Erreur métier : un code postal français compte exactement 5 chiffres. */
export class CodePostalInvalide extends Error {
  readonly code = 'CODE_POSTAL_INVALID';

  constructor() {
    super('Le code postal doit contenir exactement 5 chiffres');
    this.name = 'CodePostalInvalide';
  }
}

export class CodePostal {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): CodePostal {
    if (!CINQ_CHIFFRES.test(valeur)) {
      throw new CodePostalInvalide();
    }
    return new CodePostal(valeur);
  }
}
