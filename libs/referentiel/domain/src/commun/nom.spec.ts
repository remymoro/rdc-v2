import { Nom, NomVide } from './nom';

describe('Nom', () => {
  it.each(['', '   '])('refuse un nom vide (%j)', (valeur) => {
    expect(() => Nom.creer(valeur)).toThrow(NomVide);
  });

  it('expose le code d’erreur de RDC v1, utilisé par le front', () => {
    expect(() => Nom.creer('')).toThrow(
      expect.objectContaining({ code: 'NOM_EMPTY' }),
    );
  });
});
