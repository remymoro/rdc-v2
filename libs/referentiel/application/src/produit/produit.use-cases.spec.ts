import {
  CodeProduit,
  Famille,
  Produit,
  ProduitId,
  SousFamille,
} from '@rdc/referentiel-domain';
import { ProduitIntrouvable } from '../errors';
import { GenerateurIdentifiantsFixe } from '../testing/generateur-identifiants-fixe.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { ProduitRepositoryEnMemoire } from '../testing/produit-repository-en-memoire.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import { ActiverProduitUseCase } from './activer-produit.use-case';
import { CreerProduitUseCase } from './creer-produit.use-case';
import { DesactiverProduitUseCase } from './desactiver-produit.use-case';
import { ModifierProduitUseCase } from './modifier-produit.use-case';

describe('use cases du catalogue des produits (RDC-REF-008)', () => {
  const maintenant = new Date('2026-10-02T14:30:00.000Z');
  const produitId = ProduitId.creer('9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d');
  const horloge = new HorlogeFixe(maintenant);

  let produitRepository: ProduitRepositoryEnMemoire;
  let unitOfWork: UnitOfWorkEspion;

  function existant(actif = true): Produit {
    return Produit.reconstituer({
      id: produitId,
      code: CodeProduit.creer('D000123'),
      famille: Famille.creer('Épicerie'),
      sousFamille: SousFamille.creer('Pâtes'),
      actif,
      creeLe: new Date('2026-10-01T09:00:00.000Z'),
      modifieLe: new Date('2026-10-01T09:00:00.000Z'),
    });
  }

  function preparer(produits: Produit[] = []): void {
    produitRepository = new ProduitRepositoryEnMemoire(produits);
    unitOfWork = new UnitOfWorkEspion();
  }

  it('CreerProduitUseCase crée un produit actif avec l’identifiant généré', async () => {
    preparer();
    const creer = new CreerProduitUseCase(
      produitRepository,
      new GenerateurIdentifiantsFixe({ produitId }),
      unitOfWork,
      horloge,
    );

    const produit = await creer.execute({
      code: CodeProduit.creer('D000456'),
      famille: Famille.creer('Hygiène'),
      sousFamille: SousFamille.creer('Savon'),
    });

    expect(produit.id.equals(produitId)).toBe(true);
    expect(produit.actif).toBe(true);
    expect(produitRepository.produitsEnregistres()).toEqual([produit]);
    expect(unitOfWork.nombreDeCommits).toBe(1);
  });

  it('ModifierProduitUseCase enregistre les champs modifiés', async () => {
    preparer([existant()]);

    const produit = await new ModifierProduitUseCase(
      produitRepository,
      unitOfWork,
      horloge,
    ).execute({
      produitId,
      changements: { sousFamille: SousFamille.creer('Riz') },
    });

    expect(produit.sousFamille.valeur).toBe('Riz');
    expect((await produitRepository.get(produitId))?.modifieLe).toEqual(
      maintenant,
    );
    expect(unitOfWork.nombreDeCommits).toBe(1);
  });

  it.each([
    ['DesactiverProduitUseCase', DesactiverProduitUseCase, true, false],
    ['ActiverProduitUseCase', ActiverProduitUseCase, false, true],
  ] as const)(
    '%s change l’activité du produit',
    async (_n, UseCase, depart, arrivee) => {
      preparer([existant(depart)]);

      await new UseCase(produitRepository, unitOfWork, horloge).execute({
        produitId,
      });

      expect((await produitRepository.get(produitId))?.actif).toBe(arrivee);
      expect(unitOfWork.nombreDeCommits).toBe(1);
    },
  );

  it.each([
    [
      'ModifierProduitUseCase',
      (r: ProduitRepositoryEnMemoire, u: UnitOfWorkEspion) =>
        new ModifierProduitUseCase(r, u, horloge).execute({
          produitId,
          changements: {},
        }),
    ],
    [
      'DesactiverProduitUseCase',
      (r: ProduitRepositoryEnMemoire, u: UnitOfWorkEspion) =>
        new DesactiverProduitUseCase(r, u, horloge).execute({ produitId }),
    ],
    [
      'ActiverProduitUseCase',
      (r: ProduitRepositoryEnMemoire, u: UnitOfWorkEspion) =>
        new ActiverProduitUseCase(r, u, horloge).execute({ produitId }),
    ],
  ] as const)(
    '%s refuse un produit inconnu (PRODUIT_NOT_FOUND)',
    async (_n, executer) => {
      preparer();

      const erreur = await executer(produitRepository, unitOfWork).catch(
        (e: unknown) => e,
      );

      expect(erreur).toBeInstanceOf(ProduitIntrouvable);
      expect(erreur).toMatchObject({ code: 'PRODUIT_NOT_FOUND', produitId });
      expect(unitOfWork.nombreDeCommits).toBe(0);
    },
  );
});
