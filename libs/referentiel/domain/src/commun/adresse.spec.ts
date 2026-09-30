import { Adresse, AdresseVide } from './adresse';

describe('Adresse', () => {
  it('accepte une adresse', () => {
    expect(Adresse.creer('12 avenue Jean Jaurès').valeur).toBe(
      '12 avenue Jean Jaurès',
    );
  });

  it.each(['', '   '])('refuse une adresse vide (%j)', (valeur) => {
    expect(() => Adresse.creer(valeur)).toThrow(AdresseVide);
  });

  it('expose le code d’erreur de RDC v1', () => {
    expect(() => Adresse.creer('')).toThrow(
      expect.objectContaining({ code: 'ADRESSE_EMPTY' }),
    );
  });
});
