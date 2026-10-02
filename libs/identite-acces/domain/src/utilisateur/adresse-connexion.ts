/** Erreur métier : l'adresse de connexion est obligatoire. */
export class AdresseConnexionVide extends Error {
  readonly code = 'ADRESSE_CONNEXION_VIDE';

  constructor() {
    super("L'adresse de connexion est obligatoire");
    this.name = 'AdresseConnexionVide';
  }
}

/** Erreur métier : une adresse de connexion ne dépasse pas 254 caractères. */
export class AdresseConnexionTropLongue extends Error {
  readonly code = 'ADRESSE_CONNEXION_TROP_LONGUE';

  constructor(readonly longueurMaximale: number) {
    super(
      `L'adresse de connexion ne peut pas dépasser ${longueurMaximale} caractères`,
    );
    this.name = 'AdresseConnexionTropLongue';
  }
}

/** Erreur métier : l'adresse de connexion n'a pas la forme x@y.z. */
export class AdresseConnexionInvalide extends Error {
  readonly code = 'ADRESSE_CONNEXION_INVALIDE';

  constructor() {
    super("L'adresse de connexion est invalide");
    this.name = 'AdresseConnexionInvalide';
  }
}

/**
 * Email qui identifie un utilisateur à la connexion (RDC-ACCES-010) : propre
 * au compte, distinct de l'email de contact du centre. Normalisé en
 * minuscules pour qu'une adresse n'ait qu'une écriture, donc qu'un compte.
 */
export class AdresseConnexion {
  static readonly LONGUEUR_MAXIMALE = 254;

  // Rend le type nominal : seule une adresse validée par creer() en est une.
  private readonly type = 'AdresseConnexion';

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): AdresseConnexion {
    const adresse = valeur.trim().toLowerCase();
    if (adresse.length === 0) {
      throw new AdresseConnexionVide();
    }
    if (adresse.length > AdresseConnexion.LONGUEUR_MAXIMALE) {
      throw new AdresseConnexionTropLongue(AdresseConnexion.LONGUEUR_MAXIMALE);
    }
    if (!FORME_EMAIL.test(adresse)) {
      throw new AdresseConnexionInvalide();
    }
    return new AdresseConnexion(adresse);
  }

  equals(autre: AdresseConnexion): boolean {
    return this.valeur === autre.valeur;
  }
}

/** Forme simple x@y.z, comme l'email du référentiel et la v1. */
const FORME_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
