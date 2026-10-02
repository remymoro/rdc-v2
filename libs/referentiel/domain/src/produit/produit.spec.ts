import { CodeProduit } from './code-produit';
import { Famille, SousFamille } from './famille';
import { Produit } from './produit';
import { ProduitId } from './produit-id';

describe('Produit (RDC-REF-008)', () => {
  const maintenant = new Date('2026-10-01T09:00:00.000Z');
  const plusTard = new Date('2026-10-05T10:00:00.000Z');
  const id = ProduitId.creer('9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d');

  function nouveau(): Produit {
    return Produit.creer(
      {
        id,
        code: CodeProduit.creer('D000123'),
        famille: Famille.creer('Épicerie'),
        sousFamille: SousFamille.creer('Pâtes'),
      },
      maintenant,
    );
  }

  function existant(actif: boolean): Produit {
    return Produit.reconstituer({
      id,
      code: CodeProduit.reconstituer('ANC-42'),
      famille: Famille.creer('Épicerie'),
      sousFamille: SousFamille.creer('Pâtes'),
      actif,
      creeLe: maintenant,
      modifieLe: maintenant,
    });
  }

  it('crée un produit actif, daté, avec son identité complète', () => {
    const produit = nouveau();

    expect(produit.id.equals(id)).toBe(true);
    expect(produit.code.valeur).toBe('D000123');
    expect(produit.famille.valeur).toBe('Épicerie');
    expect(produit.sousFamille.valeur).toBe('Pâtes');
    expect(produit.actif).toBe(true);
    expect(produit.creeLe).toEqual(maintenant);
    expect(produit.modifieLe).toEqual(maintenant);
  });

  it('reconstitue un produit persisté tel quel, ancien code compris', () => {
    const produit = existant(false);

    expect(produit.code.valeur).toBe('ANC-42');
    expect(produit.actif).toBe(false);
  });

  it('désactive puis réactive un produit, en datant chaque changement', () => {
    const produit = nouveau();

    produit.desactiver(plusTard);
    expect(produit.actif).toBe(false);
    expect(produit.modifieLe).toEqual(plusTard);

    const encorePlusTard = new Date('2026-10-06T10:00:00.000Z');
    produit.activer(encorePlusTard);
    expect(produit.actif).toBe(true);
    expect(produit.modifieLe).toEqual(encorePlusTard);
  });

  it.each([
    ['desactiver', false],
    ['activer', true],
  ] as const)('%s : sans effet si déjà dans cet état', (action, actif) => {
    const produit = existant(actif);

    produit[action](plusTard);

    expect(produit.actif).toBe(actif);
    expect(produit.modifieLe).toEqual(maintenant);
  });

  it('modifie les champs fournis et garde les autres', () => {
    const produit = nouveau();

    produit.modifier({ sousFamille: SousFamille.creer('Riz') }, plusTard);

    expect(produit.sousFamille.valeur).toBe('Riz');
    expect(produit.famille.valeur).toBe('Épicerie');
    expect(produit.code.valeur).toBe('D000123');
    expect(produit.modifieLe).toEqual(plusTard);
  });

  it('ne change pas modifieLe pour une modification identique', () => {
    const produit = nouveau();

    produit.modifier(
      {
        code: CodeProduit.creer('D000123'),
        famille: Famille.creer('Épicerie'),
      },
      plusTard,
    );

    expect(produit.modifieLe).toEqual(maintenant);
  });

  it('se modifie même désactivé : on corrige un produit sans le réactiver', () => {
    const produit = existant(false);

    produit.modifier({ famille: Famille.creer('Hygiène') }, plusTard);

    expect(produit.famille.valeur).toBe('Hygiène');
    expect(produit.actif).toBe(false);
  });
});
