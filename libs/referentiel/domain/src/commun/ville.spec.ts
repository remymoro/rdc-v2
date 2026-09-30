import { Ville, VilleVide } from './ville';

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
});
