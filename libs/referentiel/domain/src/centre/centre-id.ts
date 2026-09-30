/** Erreur métier : l'identifiant d'un centre est obligatoire. */
export class CentreIdVide extends Error {
  readonly code = 'CENTRE_ID_EMPTY';

  constructor() {
    super("L'identifiant du centre est obligatoire");
    this.name = 'CentreIdVide';
  }
}

export class CentreId {
  // Rend le type nominal : un autre identifiant de même forme n'est pas un CentreId.
  private readonly type = 'CentreId';

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): CentreId {
    if (valeur.trim().length === 0) {
      throw new CentreIdVide();
    }
    return new CentreId(valeur);
  }

  equals(autre: CentreId): boolean {
    return this.valeur === autre.valeur;
  }
}
