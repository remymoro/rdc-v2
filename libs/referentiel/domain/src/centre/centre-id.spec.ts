import { CentreId, CentreIdInvalide, CentreIdVide } from './centre-id';

describe('CentreId', () => {
  const uuidValide = '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12';

  describe('normalisation', () => {
    it('retire les espaces et passe en minuscules', () => {
      expect(CentreId.creer(`  ${uuidValide.toUpperCase()}  `).valeur).toBe(
        uuidValide,
      );
    });

    it('rend égales deux écritures du même identifiant', () => {
      const enMajuscules = CentreId.creer(uuidValide.toUpperCase());
      const enMinuscules = CentreId.creer(uuidValide);
      expect(enMajuscules.equals(enMinuscules)).toBe(true);
    });
  });

  describe('format UUID', () => {
    it('accepte un UUID', () => {
      expect(CentreId.creer(uuidValide).valeur).toBe(uuidValide);
    });

    it.each([
      'abc',
      '7f1c9d7e2d4b4f7a9c1e3b8a5d6e0f12', // sans tirets
      '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f1', // un caractère de moins
      '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f1z', // caractère non hexadécimal
    ])('refuse un identifiant qui n’est pas un UUID (%j)', (valeur) => {
      expect(() => CentreId.creer(valeur)).toThrow(CentreIdInvalide);
    });

    it('expose le code d’erreur de RDC v1', () => {
      expect(() => CentreId.creer('abc')).toThrow(
        expect.objectContaining({ code: 'CENTRE_ID_INVALID' }),
      );
    });
  });

  it.each(['', '   '])('refuse un identifiant vide (%j)', (valeur) => {
    expect(() => CentreId.creer(valeur)).toThrow(CentreIdVide);
  });

  it('expose le code d’erreur de RDC v1', () => {
    expect(() => CentreId.creer('')).toThrow(
      expect.objectContaining({ code: 'CENTRE_ID_EMPTY' }),
    );
  });
});
