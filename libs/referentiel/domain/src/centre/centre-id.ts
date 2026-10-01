import { FORMAT_UUID } from '../commun/format-uuid';

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

export class CentreId {
  // Rend le type nominal : un autre identifiant de même forme n'est pas un CentreId.
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
