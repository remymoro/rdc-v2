import { randomUUID } from 'node:crypto';
import { GenerateurIdentifiants } from '@rdc/referentiel-application';
import { CentreId, MagasinId, ProduitId } from '@rdc/referentiel-domain';

/** Adapter du port GenerateurIdentifiants : UUID v4 (TENETS-PORT-004). */
export class GenerateurIdentifiantsUuid extends GenerateurIdentifiants {
  nouveauCentreId(): CentreId {
    return CentreId.creer(randomUUID());
  }

  nouveauMagasinId(): MagasinId {
    return MagasinId.creer(randomUUID());
  }

  nouveauProduitId(): ProduitId {
    return ProduitId.creer(randomUUID());
  }
}
