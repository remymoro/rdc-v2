/**
 * Erreur d'adapter (TENETS-VALUE-003, ERROR-005) : une ligne `Centre` lue en
 * base ne respecte plus les invariants du domaine (donnée v1 non reprise,
 * modification manuelle…). Ce n'est pas une erreur de saisie : elle n'est pas
 * traduite par le filtre du contexte et devient un 500 journalisé
 * (TENETS-ERROR-007). Le message ne contient que l'identifiant technique, jamais
 * les valeurs de la ligne (données personnelles).
 */
export class CentrePersisteInvalide extends Error {
  readonly code = 'CENTRE_PERSISTED_INVALID';

  constructor(
    readonly idLigne: string,
    options: { readonly cause: Error },
  ) {
    super(
      `La ligne Centre ${idLigne} ne respecte pas les invariants du domaine.`,
      options,
    );
    this.name = 'CentrePersisteInvalide';
  }
}
