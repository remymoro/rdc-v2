import { Telephone, TelephoneVide } from './telephone';

describe('Telephone', () => {
  it.each(['', '   '])('refuse un téléphone vide (%j)', (valeur) => {
    expect(() => Telephone.creer(valeur)).toThrow(TelephoneVide);
  });

  it('expose le code d’erreur de RDC v1', () => {
    expect(() => Telephone.creer('')).toThrow(
      expect.objectContaining({ code: 'TELEPHONE_EMPTY' }),
    );
  });
});
