import {
  CodeProduit,
  Famille,
  Produit,
  ProduitId,
  SousFamille,
} from '@rdc/referentiel-domain';
import type { LecturesProduits } from './lectures-produits';

export interface ContexteContratLecturesProduits {
  readonly lectures: LecturesProduits;
  readonly enregistrer: (produits: readonly Produit[]) => Promise<void>;
  readonly nettoyer: () => Promise<void>;
}

/** Suite de contrat du port de lecture LecturesProduits (TENETS-TEST-003). */
export function verifierContratLecturesProduits(
  implementation: string,
  preparer: () => Promise<ContexteContratLecturesProduits>,
): void {
  describe(`${implementation} respecte le contrat LecturesProduits`, () => {
    let contexte: ContexteContratLecturesProduits;

    beforeEach(async () => {
      contexte = await preparer();
    });

    afterEach(async () => {
      await contexte.nettoyer();
    });

    function produit(id: string, code: string, actif = true): Produit {
      return Produit.reconstituer({
        id: ProduitId.creer(id),
        code: CodeProduit.reconstituer(code),
        famille: Famille.creer('Épicerie'),
        sousFamille: SousFamille.creer('Pâtes'),
        actif,
        creeLe: new Date('2026-10-01T09:00:00.000Z'),
        modifieLe: new Date('2026-10-02T14:30:00.000Z'),
      });
    }

    it('liste tout le catalogue, trié par code, produits inactifs compris', async () => {
      await contexte.enregistrer([
        produit('9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d', 'D000300'),
        produit('1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d', 'D000100', false),
        produit('2c3d4e5f-6071-4b8c-9d0e-1f2a3b4c5d6e', 'D000200'),
      ]);

      const vues = await contexte.lectures.list();

      expect(vues.map((v) => v.code)).toEqual([
        'D000100',
        'D000200',
        'D000300',
      ]);
      expect(vues[0]).toEqual({
        id: '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d',
        code: 'D000100',
        famille: 'Épicerie',
        sousFamille: 'Pâtes',
        actif: false,
        creeLe: new Date('2026-10-01T09:00:00.000Z'),
        modifieLe: new Date('2026-10-02T14:30:00.000Z'),
      });
    });

    it('renvoie une liste vide pour un catalogue vide', async () => {
      expect(await contexte.lectures.list()).toEqual([]);
    });
  });
}
