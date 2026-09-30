import { Nom, NomTropLong, NomVide } from './nom';

describe('Nom', () => {
  it.each(['', '   '])('refuse un nom vide (%j)', (valeur) => {
    expect(() => Nom.creer(valeur)).toThrow(NomVide);
  });

  it('expose le code d’erreur de RDC v1, utilisé par le front', () => {
    expect(() => Nom.creer('')).toThrow(
      expect.objectContaining({ code: 'NOM_EMPTY' }),
    );
  });

  describe('longueur maximale : 100 caractères', () => {
    it('accepte un nom de 100 caractères', () => {
      expect(Nom.creer('a'.repeat(100)).valeur).toHaveLength(100);
    });

    it('refuse un nom de 101 caractères', () => {
      expect(() => Nom.creer('a'.repeat(101))).toThrow(NomTropLong);
    });

    it('expose le code d’erreur de RDC v1', () => {
      expect(() => Nom.creer('a'.repeat(101))).toThrow(
        expect.objectContaining({ code: 'NOM_TOO_LONG' }),
      );
    });
  });
});
