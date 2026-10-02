import { FamilleVide, Produit } from '@rdc/referentiel-domain';
import type { Prisma } from '@rdc/shared-kernel-adapters';
import { ProduitPersisteInvalide } from './produit-persiste-invalide';
import { versLigneProduit, versProduit } from './produit.mapper';

describe('mapper Produit ↔ ligne Prisma', () => {
  function uneLigne(surcharges: Partial<Prisma.ProduitModel> = {}) {
    return {
      id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
      code: 'D000123',
      famille: 'Épicerie',
      sousFamille: 'Pâtes',
      actif: false,
      createdAt: new Date('2026-10-01T09:00:00.000Z'),
      updatedAt: new Date('2026-10-02T14:30:00.000Z'),
      ...surcharges,
    } satisfies Prisma.ProduitModel;
  }

  it('fait l’aller-retour sans perte', () => {
    const ligne = uneLigne();

    const produit = versProduit(ligne);

    expect(produit).toBeInstanceOf(Produit);
    expect(versLigneProduit(produit)).toEqual(ligne);
  });

  it('accepte un ancien format de code (données importées)', () => {
    expect(versProduit(uneLigne({ code: 'ANC-42' })).code.valeur).toBe(
      'ANC-42',
    );
  });

  it('refuse une ligne invalide par ProduitPersisteInvalide en gardant la cause', () => {
    let erreur: unknown;
    try {
      versProduit(uneLigne({ famille: '  ' }));
    } catch (e) {
      erreur = e;
    }

    expect(erreur).toBeInstanceOf(ProduitPersisteInvalide);
    expect((erreur as ProduitPersisteInvalide).code).toBe(
      'PRODUIT_PERSISTED_INVALID',
    );
    expect((erreur as Error).cause).toBeInstanceOf(FamilleVide);
  });
});
