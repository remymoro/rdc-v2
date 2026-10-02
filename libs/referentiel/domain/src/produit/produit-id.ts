import { FORMAT_UUID } from '../commun/format-uuid';

/** Erreur métier : l'identifiant d'un produit est obligatoire. */
export class ProduitIdVide extends Error {
  readonly code = 'PRODUIT_ID_EMPTY';

  constructor() {
    super("L'identifiant du produit est obligatoire");
    this.name = 'ProduitIdVide';
  }
}

/** Erreur métier : l'identifiant d'un produit est un UUID. */
export class ProduitIdInvalide extends Error {
  readonly code = 'PRODUIT_ID_INVALID';

  constructor() {
    super("L'identifiant du produit est invalide");
    this.name = 'ProduitIdInvalide';
  }
}

export class ProduitId {
  // Rend le type nominal : un MagasinId de même forme n'est pas un ProduitId.
  private readonly type = 'ProduitId';

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): ProduitId {
    const identifiant = valeur.trim().toLowerCase();
    if (identifiant.length === 0) {
      throw new ProduitIdVide();
    }
    if (!FORMAT_UUID.test(identifiant)) {
      throw new ProduitIdInvalide();
    }
    return new ProduitId(identifiant);
  }

  equals(autre: ProduitId): boolean {
    return this.valeur === autre.valeur;
  }
}
