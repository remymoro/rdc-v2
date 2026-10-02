import { ProduitId, ProduitIdInvalide, ProduitIdVide } from './produit-id';

describe('ProduitId', () => {
  const uuid = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

  it('accepte un UUID, normalisé (espaces, minuscules)', () => {
    expect(ProduitId.creer(` ${uuid.toUpperCase()} `).valeur).toBe(uuid);
  });

  it('compare par valeur', () => {
    expect(
      ProduitId.creer(uuid).equals(ProduitId.creer(uuid.toUpperCase())),
    ).toBe(true);
  });

  it.each(['', '  '])(
    'refuse un identifiant vide %j (PRODUIT_ID_EMPTY)',
    (v) => {
      expect(() => ProduitId.creer(v)).toThrow(ProduitIdVide);
    },
  );

  it('refuse un identifiant qui n’est pas un UUID (PRODUIT_ID_INVALID)', () => {
    expect(() => ProduitId.creer('abc')).toThrow(
      expect.objectContaining({ code: 'PRODUIT_ID_INVALID' }),
    );
    expect(() => ProduitId.creer('abc')).toThrow(ProduitIdInvalide);
  });
});
