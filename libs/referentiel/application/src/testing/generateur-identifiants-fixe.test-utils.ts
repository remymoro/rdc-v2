import {
  CentreId,
  ImageMagasinId,
  MagasinId,
  ProduitId,
} from '@rdc/referentiel-domain';
import { GenerateurIdentifiants } from '../ports/generateur-identifiants';

/** Renvoie toujours les mêmes identifiants : les tests restent déterministes. */
export class GenerateurIdentifiantsFixe extends GenerateurIdentifiants {
  private readonly centreId: CentreId;
  private readonly magasinId: MagasinId;
  private readonly produitId: ProduitId;
  private readonly imageMagasinId: ImageMagasinId;

  constructor(
    identifiants: {
      centreId?: CentreId;
      magasinId?: MagasinId;
      produitId?: ProduitId;
      imageMagasinId?: ImageMagasinId;
    } = {},
  ) {
    super();
    this.centreId =
      identifiants.centreId ??
      CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');
    this.magasinId =
      identifiants.magasinId ??
      MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
    this.produitId =
      identifiants.produitId ??
      ProduitId.creer('9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d');
    this.imageMagasinId =
      identifiants.imageMagasinId ??
      ImageMagasinId.creer('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d');
  }

  nouveauCentreId(): CentreId {
    return this.centreId;
  }

  nouveauMagasinId(): MagasinId {
    return this.magasinId;
  }

  nouveauProduitId(): ProduitId {
    return this.produitId;
  }

  nouvelleImageMagasinId(): ImageMagasinId {
    return this.imageMagasinId;
  }
}
