import { MagasinId, MagasinIdInvalide, MagasinIdVide } from './magasin-id';

describe('MagasinId', () => {
  const uuidValide = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';

  describe('normalisation', () => {
    it('retire les espaces et passe en minuscules', () => {
      expect(MagasinId.creer(`  ${uuidValide.toUpperCase()}  `).valeur).toBe(
        uuidValide,
      );
    });

    it('rend égales deux écritures du même identifiant', () => {
      const enMajuscules = MagasinId.creer(uuidValide.toUpperCase());
      const enMinuscules = MagasinId.creer(uuidValide);
      expect(enMajuscules.equals(enMinuscules)).toBe(true);
    });
  });

  describe('format UUID', () => {
    it('accepte un UUID', () => {
      expect(MagasinId.creer(uuidValide).valeur).toBe(uuidValide);
    });

    it.each([
      'abc',
      '3b8a5d6e0f124f7a9c1e7f1c9d7e2d4b', // sans tirets
      '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4', // un caractère de moins
      '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4z', // caractère non hexadécimal
    ])('refuse un identifiant qui n’est pas un UUID (%j)', (valeur) => {
      expect(() => MagasinId.creer(valeur)).toThrow(MagasinIdInvalide);
    });
  });

  it.each(['', '   '])('refuse un identifiant vide (%j)', (valeur) => {
    expect(() => MagasinId.creer(valeur)).toThrow(MagasinIdVide);
  });
});
