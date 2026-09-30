const SEPARATEURS = /[\s.\-()]/g;
/** +33 suivi de 1 à 7 ou 9 (les 08 surtaxés sont exclus), puis 8 chiffres. */
const NUMERO_FRANCAIS_ACCEPTE = /^\+33[1-79]\d{8}$/;

/** 05… devient +335… ; +33… est conservé ; toute autre forme reste invalide. */
function versFormatInternational(numero: string): string {
  if (numero.startsWith('0')) {
    return `+33${numero.slice(1)}`;
  }
  return numero;
}

/** Erreur métier : un téléphone renseigné ne peut pas être vide. */
export class TelephoneVide extends Error {
  readonly code = 'TELEPHONE_EMPTY';

  constructor() {
    super('Le téléphone ne peut pas être vide');
    this.name = 'TelephoneVide';
  }
}

/** Erreur métier : seuls les numéros français 01 à 07 et 09 sont acceptés. */
export class TelephoneInvalide extends Error {
  readonly code = 'TELEPHONE_INVALID';

  constructor() {
    super('Le téléphone doit être un numéro français valide (01-07, 09)');
    this.name = 'TelephoneInvalide';
  }
}

export class Telephone {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Telephone {
    if (valeur.trim().length === 0) {
      throw new TelephoneVide();
    }
    const international = versFormatInternational(
      valeur.replace(SEPARATEURS, ''),
    );
    if (!NUMERO_FRANCAIS_ACCEPTE.test(international)) {
      throw new TelephoneInvalide();
    }
    return new Telephone(international);
  }
}
