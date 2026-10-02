import {
  Famille,
  FamilleTropLongue,
  FamilleVide,
  SousFamille,
  SousFamilleTropLongue,
  SousFamilleVide,
} from './famille';

describe.each([
  ['Famille', Famille, FamilleVide, FamilleTropLongue, 'FAMILLE'],
  [
    'SousFamille',
    SousFamille,
    SousFamilleVide,
    SousFamilleTropLongue,
    'SOUS_FAMILLE',
  ],
] as const)('%s (RDC-REF-008)', (_nom, Type, Vide, TropLongue, prefixe) => {
  it('retire les espaces autour et réduit les espaces internes', () => {
    expect(Type.creer('  Épicerie   salée ').valeur).toBe('Épicerie salée');
  });

  it.each(['', '   '])(`refuse une valeur vide %j (${prefixe}_EMPTY)`, (v) => {
    expect(() => Type.creer(v)).toThrow(Vide);
    expect(() => Type.creer(v)).toThrow(
      expect.objectContaining({ code: `${prefixe}_EMPTY` }),
    );
  });

  it(`refuse plus de 100 caractères (${prefixe}_TOO_LONG)`, () => {
    expect(Type.creer('a'.repeat(100)).valeur).toHaveLength(100);
    expect(() => Type.creer('a'.repeat(101))).toThrow(TropLongue);
  });
});
