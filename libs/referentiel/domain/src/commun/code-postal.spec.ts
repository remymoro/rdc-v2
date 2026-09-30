import { CodePostal, CodePostalInvalide } from './code-postal';

describe('CodePostal', () => {
  it('accepte 5 chiffres', () => {
    expect(CodePostal.creer('47000').valeur).toBe('47000');
  });

  it.each([
    '', // vide
    '4700', // 4 chiffres
    '470000', // 6 chiffres
    '47 000', // espace au milieu
    'ABCDE', // lettres
  ])('refuse ce qui n’est pas exactement 5 chiffres (%j)', (valeur) => {
    expect(() => CodePostal.creer(valeur)).toThrow(CodePostalInvalide);
  });

  it('expose le code d’erreur de RDC v1', () => {
    expect(() => CodePostal.creer('4700')).toThrow(
      expect.objectContaining({ code: 'CODE_POSTAL_INVALID' }),
    );
  });
});
