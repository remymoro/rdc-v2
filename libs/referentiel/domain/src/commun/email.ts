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

/** Erreur métier : l'email n'a pas la forme x@y.z. */
export class EmailInvalide extends Error {
  readonly code = 'EMAIL_INVALID';

  constructor() {
    super("Format d'email invalide");
    this.name = 'EmailInvalide';
  }
}

export class Email {
  static readonly LONGUEUR_MAXIMALE = 254;

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Email {
    const email = texteObligatoire(valeur, {
      longueurMaximale: Email.LONGUEUR_MAXIMALE,
      espacesInternes: 'conserves',
      siVide: () => new EmailVide(),
      siTropLong: (longueurMaximale) => new EmailTropLong(longueurMaximale),
    }).toLowerCase();
    if (!FORME_EMAIL.test(email)) {
      throw new EmailInvalide();
    }
    return new Email(email);
  }
}

/**
 * Forme simple x@y.z reprise de RDC v1 : elle écarte les fautes de frappe
 * évidentes, sans prétendre garantir qu'une adresse existe.
 */
const FORME_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
