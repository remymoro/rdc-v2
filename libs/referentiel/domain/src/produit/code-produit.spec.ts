import {
  CodeProduit,
  CodeProduitInvalide,
  CodeProduitVide,
} from './code-produit';

describe('CodeProduit (RDC-REF-008)', () => {
  describe('creer : nouveau code, format strict', () => {
    it.each(['D000123', ' D000123 ', 'd000123'])(
      'accepte « D » suivi de 6 chiffres (%j), normalisé en majuscule',
      (valeur) => {
        expect(CodeProduit.creer(valeur).valeur).toBe('D000123');
      },
    );

    it.each(['D12345', 'D1234567', 'X000123', 'D00012A', '000123'])(
      'refuse %j (CODE_PRODUIT_INVALID)',
      (valeur) => {
        expect(() => CodeProduit.creer(valeur)).toThrow(CodeProduitInvalide);
        expect(() => CodeProduit.creer(valeur)).toThrow(
          expect.objectContaining({ code: 'CODE_PRODUIT_INVALID' }),
        );
      },
    );

    it.each(['', '   '])(
      'refuse un code vide %j (CODE_PRODUIT_EMPTY)',
      (valeur) => {
        expect(() => CodeProduit.creer(valeur)).toThrow(CodeProduitVide);
      },
    );
  });

  describe('reconstituer : données historiques importées', () => {
    it('accepte un ancien format, tel qu’il est stocké', () => {
      expect(CodeProduit.reconstituer('ANC-42').valeur).toBe('ANC-42');
    });

    it('refuse quand même un code vide', () => {
      expect(() => CodeProduit.reconstituer('  ')).toThrow(CodeProduitVide);
    });
  });
});
