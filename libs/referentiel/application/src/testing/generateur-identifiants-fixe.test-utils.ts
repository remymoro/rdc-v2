import { type CentreId, MagasinId } from '@rdc/referentiel-domain';
import { GenerateurIdentifiants } from '../ports/generateur-identifiants';

/** Renvoie toujours le même identifiant : les tests restent déterministes. */
export class GenerateurIdentifiantsFixe extends GenerateurIdentifiants {
  constructor(
    private readonly centreId: CentreId,
    private readonly magasinId = MagasinId.creer(
      '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b',
    ),
  ) {
    super();
  }

  nouveauCentreId(): CentreId {
    return this.centreId;
  }

  nouveauMagasinId(): MagasinId {
    return this.magasinId;
  }
}
