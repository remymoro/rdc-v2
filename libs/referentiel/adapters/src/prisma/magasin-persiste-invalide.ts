/**
 * Erreur d'adapter (TENETS-VALUE-003, ERROR-005) : une ligne `Magasin` lue en
 * base ne respecte plus les invariants du domaine (donnée v1 non reprise,
 * modification manuelle…). Ce n'est pas une erreur de saisie : elle n'est pas
 * traduite par le filtre du contexte et devient un 500 journalisé
 * (TENETS-ERROR-007). Le message ne contient que l'identifiant technique, jamais
 * les valeurs de la ligne.
 */
export class MagasinPersisteInvalide extends Error {
  readonly code = 'MAGASIN_PERSISTED_INVALID';

  constructor(
    readonly idLigne: string,
    options: { readonly cause: Error },
  ) {
    super(
      `La ligne Magasin ${idLigne} ne respecte pas les invariants du domaine.`,
      options,
    );
    this.name = 'MagasinPersisteInvalide';
  }
}
