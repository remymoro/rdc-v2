import { FORMAT_UUID } from '../commun/format-uuid';

/** Erreur métier : l'identifiant d'un magasin est obligatoire. */
export class MagasinIdVide extends Error {
  readonly code = 'MAGASIN_ID_EMPTY';

  constructor() {
    super("L'identifiant du magasin est obligatoire");
    this.name = 'MagasinIdVide';
  }
}

/** Erreur métier : l'identifiant d'un magasin est un UUID. */
export class MagasinIdInvalide extends Error {
  readonly code = 'MAGASIN_ID_INVALID';

  constructor() {
    super("L'identifiant du magasin est invalide");
    this.name = 'MagasinIdInvalide';
  }
}

export class MagasinId {
  // Rend le type nominal : un CentreId de même forme n'est pas un MagasinId.
  private readonly type = 'MagasinId';

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): MagasinId {
    const identifiant = valeur.trim().toLowerCase();
    if (identifiant.length === 0) {
      throw new MagasinIdVide();
    }
    if (!FORMAT_UUID.test(identifiant)) {
      throw new MagasinIdInvalide();
    }
    return new MagasinId(identifiant);
  }

  equals(autre: MagasinId): boolean {
    return this.valeur === autre.valeur;
  }
}
