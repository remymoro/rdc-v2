import type { CentreId } from '@rdc/referentiel-domain';
import { GenerateurIdentifiants } from '../ports/generateur-identifiants';

/** Renvoie toujours le même identifiant : les tests restent déterministes. */
export class GenerateurIdentifiantsFixe extends GenerateurIdentifiants {
  constructor(private readonly centreId: CentreId) {
    super();
  }

  nouveauCentreId(): CentreId {
    return this.centreId;
  }
}
