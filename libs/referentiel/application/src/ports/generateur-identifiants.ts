import type { CentreId, MagasinId, ProduitId } from '@rdc/referentiel-domain';

/** Génère les identifiants des nouveaux objets du contexte (TENETS-PORT-004). */
export abstract class GenerateurIdentifiants {
  abstract nouveauCentreId(): CentreId;

  abstract nouveauMagasinId(): MagasinId;

  abstract nouveauProduitId(): ProduitId;
}
