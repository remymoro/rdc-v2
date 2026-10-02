/** Forme canonique d'un UUID : minuscules, avec tirets. */
const FORMAT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Erreur métier : l'identifiant d'un utilisateur est obligatoire. */
export class UtilisateurIdVide extends Error {
  readonly code = 'USER_ID_EMPTY'; // code v1

  constructor() {
    super("L'identifiant de l'utilisateur est obligatoire");
    this.name = 'UtilisateurIdVide';
  }
}

/** Erreur métier : l'identifiant d'un utilisateur est un UUID. */
export class UtilisateurIdInvalide extends Error {
  readonly code = 'USER_ID_INVALID'; // code v1

  constructor() {
    super("L'identifiant de l'utilisateur est invalide");
    this.name = 'UtilisateurIdInvalide';
  }
}

export class UtilisateurId {
  // Rend le type nominal : un autre identifiant de même forme n'est pas un UtilisateurId.
  private readonly type = 'UtilisateurId';

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): UtilisateurId {
    const identifiant = valeur.trim().toLowerCase();
    if (identifiant.length === 0) {
      throw new UtilisateurIdVide();
    }
    if (!FORMAT_UUID.test(identifiant)) {
      throw new UtilisateurIdInvalide();
    }
    return new UtilisateurId(identifiant);
  }

  equals(autre: UtilisateurId): boolean {
    return this.valeur === autre.valeur;
  }
}

/** Erreur métier : l'identifiant d'un centre est obligatoire. */
export class CentreIdVide extends Error {
  readonly code = 'CENTRE_ID_EMPTY';

  constructor() {
    super("L'identifiant du centre est obligatoire");
    this.name = 'CentreIdVide';
  }
}

/** Erreur métier : l'identifiant d'un centre est un UUID. */
export class CentreIdInvalide extends Error {
  readonly code = 'CENTRE_ID_INVALID';

  constructor() {
    super("L'identifiant du centre est invalide");
    this.name = 'CentreIdInvalide';
  }
}

/**
 * Référence locale au centre d'un compte (TENETS-PORT-010) : le contexte
 * n'importe pas le référentiel, il en garde seulement l'identifiant, avec les
 * mêmes codes d'erreur (TENETS-CONTEXT-002).
 */
export class CentreId {
  private readonly type = 'CentreId';

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): CentreId {
    const identifiant = valeur.trim().toLowerCase();
    if (identifiant.length === 0) {
      throw new CentreIdVide();
    }
    if (!FORMAT_UUID.test(identifiant)) {
      throw new CentreIdInvalide();
    }
    return new CentreId(identifiant);
  }

  equals(autre: CentreId): boolean {
    return this.valeur === autre.valeur;
  }
}
