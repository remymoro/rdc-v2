// Erreurs applicatives : issues des workflows du contexte (TENETS-ERROR-003).

/** Un centre de même nom, adresse, code postal et ville existe déjà. */
export class CentreDejaExistant extends Error {
  readonly code = 'CENTRE_ALREADY_EXISTS';

  constructor() {
    super('Un centre avec le même nom et la même adresse existe déjà.');
    this.name = 'CentreDejaExistant';
  }
}
