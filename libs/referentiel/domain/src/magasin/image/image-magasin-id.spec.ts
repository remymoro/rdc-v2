import {
  ImageMagasinId,
  ImageMagasinIdInvalide,
  ImageMagasinIdVide,
} from './image-magasin-id';

describe('ImageMagasinId', () => {
  const uuidValide = '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d';

  it('normalise un UUID (espaces, minuscules)', () => {
    expect(ImageMagasinId.creer(`  ${uuidValide.toUpperCase()} `).valeur).toBe(
      uuidValide,
    );
  });

  it('compare par valeur', () => {
    expect(
      ImageMagasinId.creer(uuidValide).equals(ImageMagasinId.creer(uuidValide)),
    ).toBe(true);
  });

  it.each(['abc', '../../etc/passwd', '0d4e2b8c6a1f4c3e9b7d5f2a8e1c4b6d'])(
    'refuse un identifiant qui n’est pas un UUID (%j) : IMAGE_ID_INVALID',
    (valeur) => {
      expect(() => ImageMagasinId.creer(valeur)).toThrow(
        ImageMagasinIdInvalide,
      );
    },
  );

  it.each(['', '  '])('refuse un identifiant vide (%j)', (valeur) => {
    expect(() => ImageMagasinId.creer(valeur)).toThrow(ImageMagasinIdVide);
  });
});
