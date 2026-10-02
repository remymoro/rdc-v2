import type { UtilisateurId } from './identifiants';

/**
 * Erreur métier : le compte d'un centre a toujours un centre (RDC-ACCES-001).
 * Levée à la reconstitution : une ligne incohérente n'entre pas dans le modèle.
 */
export class CompteCentreSansCentre extends Error {
  readonly code = 'USER_CENTRE_REQUIRED';

  constructor(readonly utilisateurId: UtilisateurId) {
    super(`Le compte de centre ${utilisateurId.valeur} n'a pas de centre`);
    this.name = 'CompteCentreSansCentre';
  }
}

/** Erreur métier : l'administrateur n'est rattaché à aucun centre. */
export class AdministrateurRattacheAUnCentre extends Error {
  readonly code = 'ADMIN_CENTRE_INTERDIT';

  constructor(readonly utilisateurId: UtilisateurId) {
    super(
      `L'administrateur ${utilisateurId.valeur} ne peut pas être rattaché à un centre`,
    );
    this.name = 'AdministrateurRattacheAUnCentre';
  }
}

/**
 * Erreur métier : l'administrateur est unique (RDC-ACCES-011) ; le désactiver
 * ne laisserait plus personne pour administrer.
 */
export class AdministrateurNonDesactivable extends Error {
  readonly code = 'ADMIN_NON_DESACTIVABLE';

  constructor(readonly utilisateurId: UtilisateurId) {
    super("L'administrateur ne peut pas être désactivé");
    this.name = 'AdministrateurNonDesactivable';
  }
}
