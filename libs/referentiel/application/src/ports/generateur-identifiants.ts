import type {
  CentreId,
  ImageMagasinId,
  MagasinId,
  ProduitId,
} from '@rdc/referentiel-domain';

/** Génère les identifiants des nouveaux objets du contexte (TENETS-PORT-004). */
export abstract class GenerateurIdentifiants {
  abstract nouveauCentreId(): CentreId;

  abstract nouveauMagasinId(): MagasinId;

  abstract nouveauProduitId(): ProduitId;

  /** Identifiant d'une nouvelle image, qui nomme aussi son fichier (audit A-18). */
  abstract nouvelleImageMagasinId(): ImageMagasinId;
}
