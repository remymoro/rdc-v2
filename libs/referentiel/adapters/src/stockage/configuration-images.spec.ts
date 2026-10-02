import { join } from 'node:path';
import {
  FichierImage,
  FormatImage,
  ImageMagasinId,
} from '@rdc/referentiel-domain';
import {
  dossierDesImages,
  EXTENSIONS_IMAGES_SERVIES,
  PREFIXE_PUBLIC_IMAGES,
} from './configuration-images';

describe('configuration du stockage des images (ADR-0021)', () => {
  it('lit le dossier dans UPLOADS_DIR', () => {
    expect(dossierDesImages({ UPLOADS_DIR: '/volume1/rdc/uploads' })).toBe(
      '/volume1/rdc/uploads',
    );
  });

  it.each([{}, { UPLOADS_DIR: '' }, { UPLOADS_DIR: '   ' }])(
    'prend ./uploads par défaut, pour le développement (%j)',
    (environnement) => {
      expect(dossierDesImages(environnement)).toBe(
        join(process.cwd(), 'uploads'),
      );
    },
  );

  it('sert les images sous /uploads, comme la v1', () => {
    expect(PREFIXE_PUBLIC_IMAGES).toBe('/uploads');
  });

  it.each(Object.values(FormatImage))(
    'sert l’extension de chaque format accepté par le domaine (%s)',
    (format) => {
      const fichier = FichierImage.pour(
        ImageMagasinId.creer('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d'),
        format,
      );
      const extension = fichier.valeur.split('.').pop();
      expect(EXTENSIONS_IMAGES_SERVIES).toContain(extension);
    },
  );
});
