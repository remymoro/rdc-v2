/**
 * Erreur d'adapter (TENETS-VALUE-003, ERROR-005) : une ligne `Produit` lue en
 * base ne respecte plus les invariants du domaine. Elle devient un 500
 * journalisé (TENETS-ERROR-007), jamais une erreur de saisie.
 */
export class ProduitPersisteInvalide extends Error {
  readonly code = 'PRODUIT_PERSISTED_INVALID';

  constructor(
    readonly idLigne: string,
    options: { readonly cause: Error },
  ) {
    super(
      `La ligne Produit ${idLigne} ne respecte pas les invariants du domaine.`,
      options,
    );
    this.name = 'ProduitPersisteInvalide';
  }
}
