import { Adresse, AdresseTropLongue, AdresseVide } from './adresse';

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

  describe('espaces', () => {
    it('sont retirés en début et en fin', () => {
      expect(Adresse.creer('  12 avenue Jean Jaurès  ').valeur).toBe(
        '12 avenue Jean Jaurès',
      );
    });

    it('sont réduits à un seul à l’intérieur', () => {
      expect(Adresse.creer('12  avenue \t Jean   Jaurès').valeur).toBe(
        '12 avenue Jean Jaurès',
      );
    });

    it('sont normalisés avant de mesurer la longueur', () => {
      const adresse = Adresse.creer(
        `  ${'a'.repeat(127)}     ${'b'.repeat(127)}  `,
      );
      expect(adresse.valeur).toHaveLength(255);
    });
  });

  describe('longueur maximale : 255 caractères', () => {
    it('accepte une adresse de 255 caractères', () => {
      expect(Adresse.creer('a'.repeat(255)).valeur).toHaveLength(255);
    });

    it('refuse une adresse de 256 caractères', () => {
      expect(() => Adresse.creer('a'.repeat(256))).toThrow(AdresseTropLongue);
    });

    it('expose le code d’erreur de RDC v1', () => {
      expect(() => Adresse.creer('a'.repeat(256))).toThrow(
        expect.objectContaining({ code: 'ADRESSE_TOO_LONG' }),
      );
    });
  });
});
