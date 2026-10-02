import { CodeProduit } from '../produit/code-produit';
import { Famille, SousFamille } from '../produit/famille';
import { Produit } from '../produit/produit';
import { ProduitId } from '../produit/produit-id';
import type { ProduitRepository } from './produit.repository';

export interface ContexteContratProduitRepository {
  readonly repository: ProduitRepository;
  readonly nettoyer: () => Promise<void>;
}

/** Suite de contrat du port ProduitRepository (TENETS-TEST-003). */
export function verifierContratProduitRepository(
  implementation: string,
  preparer: () => Promise<ContexteContratProduitRepository>,
): void {
  describe(`${implementation} respecte le contrat ProduitRepository`, () => {
    let contexte: ContexteContratProduitRepository;
    const id = ProduitId.creer('9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d');

    beforeEach(async () => {
      contexte = await preparer();
    });

    afterEach(async () => {
      await contexte.nettoyer();
    });

    function unProduit(): Produit {
      return Produit.creer(
        {
          id,
          code: CodeProduit.creer('D000123'),
          famille: Famille.creer('Épicerie'),
          sousFamille: SousFamille.creer('Pâtes'),
        },
        new Date('2026-10-01T09:00:00.000Z'),
      );
    }

    it('relit un produit enregistré à l’identique', async () => {
      const produit = unProduit();
      await contexte.repository.save(produit);

      const relu = await contexte.repository.get(id);

      expect(relu).toBeInstanceOf(Produit);
      expect(relu).toEqual(produit);
    });

    it('relit un produit modifié puis réenregistré avec son nouvel état', async () => {
      const produit = unProduit();
      await contexte.repository.save(produit);

      produit.desactiver(new Date('2026-10-02T14:30:00.000Z'));
      produit.modifier(
        { sousFamille: SousFamille.creer('Riz') },
        new Date('2026-10-02T14:30:00.000Z'),
      );
      await contexte.repository.save(produit);

      const relu = await contexte.repository.get(id);
      expect(relu?.actif).toBe(false);
      expect(relu?.sousFamille.valeur).toBe('Riz');
      expect(relu?.modifieLe).toEqual(new Date('2026-10-02T14:30:00.000Z'));
    });

    it('renvoie null pour un identifiant inconnu', async () => {
      expect(await contexte.repository.get(id)).toBeNull();
    });
  });
}
