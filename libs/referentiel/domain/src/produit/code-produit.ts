const D_ET_SIX_CHIFFRES = /^D\d{6}$/;

/** Erreur métier : un code produit est obligatoire. */
export class CodeProduitVide extends Error {
  readonly code = 'CODE_PRODUIT_EMPTY';

  constructor() {
    super('Le code du produit est obligatoire');
    this.name = 'CodeProduitVide';
  }
}

/** Erreur métier : un nouveau code produit s'écrit « D » suivi de 6 chiffres. */
export class CodeProduitInvalide extends Error {
  readonly code = 'CODE_PRODUIT_INVALID';

  constructor() {
    super('Le code du produit doit être « D » suivi de 6 chiffres');
    this.name = 'CodeProduitInvalide';
  }
}

/**
 * Code d'un produit du catalogue (RDC-REF-008). Format strict pour un nouveau
 * code ; tolérant à la relecture, pour les données historiques importées
 * (choix de la v1, conservé).
 */
export class CodeProduit {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): CodeProduit {
    const code = CodeProduit.nonVide(valeur).toUpperCase();
    if (!D_ET_SIX_CHIFFRES.test(code)) {
      throw new CodeProduitInvalide();
    }
    return new CodeProduit(code);
  }

  static reconstituer(valeur: string): CodeProduit {
    return new CodeProduit(CodeProduit.nonVide(valeur));
  }

  private static nonVide(valeur: string): string {
    const code = valeur.trim();
    if (code.length === 0) {
      throw new CodeProduitVide();
    }
    return code;
  }
}
