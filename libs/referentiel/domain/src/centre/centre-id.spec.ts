import { CentreId, CentreIdVide } from './centre-id';

describe('CentreId', () => {
  it.each(['', '   '])('refuse un identifiant vide (%j)', (valeur) => {
    expect(() => CentreId.creer(valeur)).toThrow(CentreIdVide);
  });

  it('expose le code d’erreur de RDC v1', () => {
    expect(() => CentreId.creer('')).toThrow(
      expect.objectContaining({ code: 'CENTRE_ID_EMPTY' }),
    );
  });
});
