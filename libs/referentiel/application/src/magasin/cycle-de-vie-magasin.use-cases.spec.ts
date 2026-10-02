import {
  Magasin,
  MagasinArchive,
  MagasinId,
  StatutMagasin,
} from '@rdc/referentiel-domain';
import { MagasinIntrouvable } from '../errors';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { unMagasinExistant } from '../testing/magasin-existant.test-utils';
import { MagasinRepositoryEnMemoire } from '../testing/magasin-repository-en-memoire.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import { ActiverMagasinUseCase } from './activer-magasin.use-case';
import { ArchiverMagasinUseCase } from './archiver-magasin.use-case';
import { DesactiverMagasinUseCase } from './desactiver-magasin.use-case';

/** Les trois use cases partagent le même workflow ; seule la transition change. */
const CAS = [
  {
    nom: 'DesactiverMagasinUseCase',
    UseCase: DesactiverMagasinUseCase,
    depart: StatutMagasin.ACTIF,
    arrivee: StatutMagasin.INACTIF,
    refuseSiArchive: true,
  },
  {
    nom: 'ActiverMagasinUseCase',
    UseCase: ActiverMagasinUseCase,
    depart: StatutMagasin.INACTIF,
    arrivee: StatutMagasin.ACTIF,
    refuseSiArchive: true,
  },
  {
    nom: 'ArchiverMagasinUseCase',
    UseCase: ArchiverMagasinUseCase,
    depart: StatutMagasin.ACTIF,
    arrivee: StatutMagasin.ARCHIVE,
    refuseSiArchive: false,
  },
] as const;

describe.each(CAS)('$nom', ({ UseCase, depart, arrivee, refuseSiArchive }) => {
  const maintenant = new Date('2026-10-02T14:30:00.000Z');
  const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');

  let magasinRepository: MagasinRepositoryEnMemoire;
  let unitOfWork: UnitOfWorkEspion;
  let useCase: InstanceType<typeof UseCase>;

  function preparer(magasins: Magasin[]): void {
    magasinRepository = new MagasinRepositoryEnMemoire(magasins);
    unitOfWork = new UnitOfWorkEspion();
    useCase = new UseCase(
      magasinRepository,
      unitOfWork,
      new HorlogeFixe(maintenant),
    );
  }

  it(`enregistre le magasin ${arrivee}, daté par l'horloge, en une transaction`, async () => {
    preparer([unMagasinExistant(magasinId, depart)]);

    await useCase.execute({ magasinId });

    const enregistre = await magasinRepository.get(magasinId);
    expect(enregistre?.statut).toBe(arrivee);
    expect(enregistre?.modifieLe).toEqual(maintenant);
    expect(unitOfWork.nombreDeCommits).toBe(1);
  });

  it('refuse un magasin inconnu (MAGASIN_NOT_FOUND) sans valider de transaction', async () => {
    preparer([]);

    const erreur = await useCase.execute({ magasinId }).catch((e) => e);

    expect(erreur).toBeInstanceOf(MagasinIntrouvable);
    expect(erreur).toMatchObject({ code: 'MAGASIN_NOT_FOUND', magasinId });
    expect(unitOfWork.nombreDeCommits).toBe(0);
  });

  if (refuseSiArchive) {
    it('laisse passer MagasinArchive sans rien modifier', async () => {
      preparer([unMagasinExistant(magasinId, StatutMagasin.ARCHIVE)]);

      const erreur = await useCase.execute({ magasinId }).catch((e) => e);

      expect(erreur).toBeInstanceOf(MagasinArchive);
      expect((await magasinRepository.get(magasinId))?.statut).toBe(
        StatutMagasin.ARCHIVE,
      );
      expect(unitOfWork.nombreDeCommits).toBe(0);
    });
  }
});

describe('MagasinIntrouvable', () => {
  it('porte le code et le message attendus', () => {
    const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
    const erreur = new MagasinIntrouvable(magasinId);

    expect(erreur.name).toBe('MagasinIntrouvable');
    expect(erreur.code).toBe('MAGASIN_NOT_FOUND');
    expect(erreur.message).toBe('Le magasin demandé est introuvable.');
    expect(erreur.magasinId).toBe(magasinId);
  });
});
