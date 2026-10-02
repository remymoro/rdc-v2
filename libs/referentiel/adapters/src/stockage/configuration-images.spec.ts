import { join } from 'node:path';
import {
  dossierDesImages,
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
});
