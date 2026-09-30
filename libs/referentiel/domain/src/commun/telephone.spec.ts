import { Telephone, TelephoneInvalide, TelephoneVide } from './telephone';

describe('Telephone', () => {
  it.each(['', '   '])('refuse un téléphone vide (%j)', (valeur) => {
    expect(() => Telephone.creer(valeur)).toThrow(TelephoneVide);
  });

  it('expose le code d’erreur de RDC v1', () => {
    expect(() => Telephone.creer('')).toThrow(
      expect.objectContaining({ code: 'TELEPHONE_EMPTY' }),
    );
  });

  describe('numéro français, au format international', () => {
    it.each([
      ['0553123456', '+33553123456'],
      ['05 53 12 34 56', '+33553123456'],
      ['05.53.12.34.56', '+33553123456'],
      ['05-53-12-34-56', '+33553123456'],
      ['(05) 53 12 34 56', '+33553123456'],
      ['+33 5 53 12 34 56', '+33553123456'],
      ['06 12 34 56 78', '+33612345678'],
      ['01 23 45 67 89', '+33123456789'],
      ['09 87 65 43 21', '+33987654321'],
    ])('normalise %j en %s', (saisie, attendu) => {
      expect(Telephone.creer(saisie).valeur).toBe(attendu);
    });

    it.each([
      '08 00 12 34 56', // numéro surtaxé : exclu
      '05 53 12 34', // trop court
      '05 53 12 34 56 7', // trop long
      '+44 20 1234 5678', // numéro étranger
      '5 53 12 34 56', // ni 0 ni +33
      '00 12 34 56 78', // 00 n'est pas un préfixe français valide
      '05 53 12 34 5A', // lettre
    ])('refuse %j', (saisie) => {
      expect(() => Telephone.creer(saisie)).toThrow(TelephoneInvalide);
    });

    it('expose le code d’erreur de RDC v1', () => {
      expect(() => Telephone.creer('08 00 12 34 56')).toThrow(
        expect.objectContaining({ code: 'TELEPHONE_INVALID' }),
      );
    });
  });
});
