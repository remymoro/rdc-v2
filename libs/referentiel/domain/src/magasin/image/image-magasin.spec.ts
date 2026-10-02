import { FichierImage } from './fichier-image';
import { ImageMagasin, OrdreImageInvalide } from './image-magasin';
import { ImageMagasinId } from './image-magasin-id';

describe('ImageMagasin', () => {
  const id = ImageMagasinId.creer('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d');
  const fichier = FichierImage.creer(
    '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.jpg',
  );
  const ajouteeLe = new Date('2026-10-01T09:00:00.000Z');

  it('restitue l’état persisté tel quel', () => {
    const image = ImageMagasin.reconstituer({
      id,
      fichier,
      ordre: 3,
      ajouteeLe,
    });

    expect(image.id.equals(id)).toBe(true);
    expect(image.fichier.equals(fichier)).toBe(true);
    expect(image.ordre).toBe(3);
    expect(image.ajouteeLe).toEqual(ajouteeLe);
  });

  it.each([-1, 1.5, Number.NaN])(
    'refuse un ordre qui n’est pas un entier positif ou nul (%p)',
    (ordre) => {
      expect(() =>
        ImageMagasin.reconstituer({ id, fichier, ordre, ajouteeLe }),
      ).toThrow(OrdreImageInvalide);
    },
  );

  it('est égale à une autre image de même identifiant (TENETS-ENTITY-001)', () => {
    const image = ImageMagasin.reconstituer({
      id,
      fichier,
      ordre: 0,
      ajouteeLe,
    });
    const memeIdentite = ImageMagasin.reconstituer({
      id,
      fichier,
      ordre: 4,
      ajouteeLe,
    });

    expect(image.equals(memeIdentite)).toBe(true);
  });
});
