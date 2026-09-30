/** Erreur métier : un email renseigné ne peut pas être vide. */
export class EmailVide extends Error {
  readonly code = 'EMAIL_EMPTY';

  constructor() {
    super("L'email ne peut pas être vide");
    this.name = 'EmailVide';
  }
}

export class Email {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Email {
    if (valeur.trim().length === 0) {
      throw new EmailVide();
    }
    return new Email(valeur);
  }
}
