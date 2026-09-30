import { Ville, VilleTropLongue, VilleVide } from './ville';

describe('Ville', () => {
  it('accepte un nom de ville', () => {
    expect(Ville.creer('Agen').valeur).toBe('Agen');
  });

  it.each(['', '   '])('refuse une ville vide (%j)', (valeur) => {
    expect(() => Ville.creer(valeur)).toThrow(VilleVide);
  });

  it('expose le code d’erreur de RDC v1', () => {
    expect(() => Ville.creer('')).toThrow(
      expect.objectContaining({ code: 'VILLE_EMPTY' }),
    );
  });

  describe('longueur maximale : 100 caractères', () => {
    it('accepte une ville de 100 caractères', () => {
      expect(Ville.creer('a'.repeat(100)).valeur).toHaveLength(100);
    });

    it('refuse une ville de 101 caractères', () => {
      expect(() => Ville.creer('a'.repeat(101))).toThrow(VilleTropLongue);
    });

    it('expose le code d’erreur de RDC v1', () => {
      expect(() => Ville.creer('a'.repeat(101))).toThrow(
        expect.objectContaining({ code: 'VILLE_TOO_LONG' }),
      );
    });
  });
});
