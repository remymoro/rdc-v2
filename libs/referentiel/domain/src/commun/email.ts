import { texteObligatoire } from './texte-obligatoire';

/** Erreur métier : un email renseigné ne peut pas être vide. */
export class EmailVide extends Error {
  readonly code = 'EMAIL_EMPTY';

  constructor() {
    super("L'email ne peut pas être vide");
    this.name = 'EmailVide';
  }
}

/** Erreur métier : un email ne dépasse pas 254 caractères. */
export class EmailTropLong extends Error {
  readonly code = 'EMAIL_TOO_LONG';

  constructor(readonly longueurMaximale: number) {
    super(`L'email ne peut pas dépasser ${longueurMaximale} caractères`);
    this.name = 'EmailTropLong';
  }
}

export class Email {
  static readonly LONGUEUR_MAXIMALE = 254;

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Email {
    return new Email(
      texteObligatoire(valeur, {
        longueurMaximale: Email.LONGUEUR_MAXIMALE,
        espacesInternes: 'conserves',
        siVide: () => new EmailVide(),
        siTropLong: (longueurMaximale) => new EmailTropLong(longueurMaximale),
      }),
    );
  }
}
