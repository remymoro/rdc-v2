import {
  ContenuImage,
  FichierImage,
  FormatImage,
  ImageMagasinId,
  MagasinId,
} from '@rdc/referentiel-domain';
import type { StockageImages } from './stockage-images';

export interface ContexteContratStockageImages {
  readonly stockage: StockageImages;
  /** Octets du fichier stocké, ou null s'il n'existe pas. */
  readonly lireFichier: (
    magasinId: MagasinId,
    fichier: FichierImage,
  ) => Promise<Uint8Array | null>;
  readonly nettoyer: () => Promise<void>;
}

const MAGASIN = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
const AUTRE_MAGASIN = MagasinId.creer('5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c');

/** Un petit JPEG valide (signature FF D8 FF) et reconnaissable. */
export function unContenuJpeg(marque = 7): ContenuImage {
  return ContenuImage.creer(
    new Uint8Array([0xff, 0xd8, 0xff, 0xe0, marque, marque, marque]),
  );
}

export function unFichier(id: string, format = FormatImage.JPEG): FichierImage {
  return FichierImage.pour(ImageMagasinId.creer(id), format);
}

/**
 * Suite de contrat du port StockageImages (TENETS-TEST-003) : le fake en
 * mémoire et l'adapter disque doivent la passer.
 */
export function verifierContratStockageImages(
  implementation: string,
  preparer: () => Promise<ContexteContratStockageImages>,
): void {
  describe(`${implementation} respecte le contrat StockageImages`, () => {
    let contexte: ContexteContratStockageImages;
    const fichier = unFichier('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d');
    const autreFichier = unFichier(
      '1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e',
      FormatImage.PNG,
    );

    beforeEach(async () => {
      contexte = await preparer();
    });

    afterEach(async () => {
      await contexte.nettoyer();
    });

    it('enregistre le contenu exact du fichier', async () => {
      await contexte.stockage.enregistrer(MAGASIN, fichier, unContenuJpeg(42));

      expect(await contexte.lireFichier(MAGASIN, fichier)).toEqual(
        new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 42, 42, 42]),
      );
    });

    it('refuse une collision sans modifier le fichier existant', async () => {
      await contexte.stockage.enregistrer(MAGASIN, fichier, unContenuJpeg(42));

      await expect(
        contexte.stockage.enregistrer(MAGASIN, fichier, unContenuJpeg(99)),
      ).rejects.toMatchObject({ code: 'IMAGE_FICHIER_DEJA_EXISTANT' });

      expect(await contexte.lireFichier(MAGASIN, fichier)).toEqual(
        unContenuJpeg(42).octets,
      );
    });

    it('liste les fichiers stockés, avec leur magasin et leur date', async () => {
      await contexte.stockage.enregistrer(MAGASIN, fichier, unContenuJpeg());
      await contexte.stockage.enregistrer(
        AUTRE_MAGASIN,
        autreFichier,
        unContenuJpeg(),
      );

      const stockes = await contexte.stockage.lister();

      const resume = stockes
        .map((stocke) => `${stocke.magasinId.valeur}/${stocke.fichier.valeur}`)
        .sort();
      expect(resume).toEqual(
        [
          `${MAGASIN.valeur}/${fichier.valeur}`,
          `${AUTRE_MAGASIN.valeur}/${autreFichier.valeur}`,
        ].sort(),
      );
      for (const stocke of stockes) {
        expect(stocke.magasinId).toBeInstanceOf(MagasinId);
        expect(stocke.fichier).toBeInstanceOf(FichierImage);
        expect(stocke.modifieLe).toBeInstanceOf(Date);
      }
    });

    it('ne liste rien quand rien n’est stocké', async () => {
      expect(await contexte.stockage.lister()).toEqual([]);
    });

    it('supprime un fichier, sans toucher aux autres', async () => {
      await contexte.stockage.enregistrer(MAGASIN, fichier, unContenuJpeg());
      await contexte.stockage.enregistrer(
        MAGASIN,
        autreFichier,
        unContenuJpeg(),
      );

      await contexte.stockage.supprimer(MAGASIN, fichier);

      expect(await contexte.lireFichier(MAGASIN, fichier)).toBeNull();
      expect(await contexte.lireFichier(MAGASIN, autreFichier)).not.toBeNull();
    });

    it('accepte de supprimer un fichier absent (idempotent)', async () => {
      await expect(
        contexte.stockage.supprimer(MAGASIN, fichier),
      ).resolves.toBeUndefined();
    });

    it('ne confond pas les dossiers de deux magasins', async () => {
      await contexte.stockage.enregistrer(MAGASIN, fichier, unContenuJpeg());

      await contexte.stockage.supprimer(AUTRE_MAGASIN, fichier);

      expect(await contexte.lireFichier(MAGASIN, fichier)).not.toBeNull();
      expect(await contexte.lireFichier(AUTRE_MAGASIN, fichier)).toBeNull();
    });
  });
}
