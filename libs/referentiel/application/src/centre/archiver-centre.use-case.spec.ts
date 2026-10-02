import {
  Centre,
  CentreId,
  Magasin,
  MagasinId,
  StatutCentre,
  StatutMagasin,
} from '@rdc/referentiel-domain';
import { CentreADesMagasins, CentreIntrouvable } from '../errors';
import { unCentreExistant } from '../testing/centre-existant.test-utils';
import { CentreRepositoryEnMemoire } from '../testing/centre-repository-en-memoire.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { unMagasinExistant } from '../testing/magasin-existant.test-utils';
import { MagasinRepositoryEnMemoire } from '../testing/magasin-repository-en-memoire.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import { ArchiverCentreUseCase } from './archiver-centre.use-case';

describe('ArchiverCentreUseCase', () => {
  const maintenant = new Date('2026-10-02T14:30:00.000Z');
  // Le centre de rattachement des magasins de unMagasinExistant.
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');
  const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');

  let centreRepository: CentreRepositoryEnMemoire;
  let unitOfWork: UnitOfWorkEspion;
  let archiverCentre: ArchiverCentreUseCase;

  function preparer(centres: Centre[], magasins: Magasin[] = []): void {
    centreRepository = new CentreRepositoryEnMemoire(centres);
    unitOfWork = new UnitOfWorkEspion();
    archiverCentre = new ArchiverCentreUseCase(
      centreRepository,
      new MagasinRepositoryEnMemoire(magasins),
      unitOfWork,
      new HorlogeFixe(maintenant),
    );
  }

  describe.each([StatutCentre.ACTIF, StatutCentre.INACTIF])(
    'centre %s',
    (statut) => {
      beforeEach(() => preparer([unCentreExistant(centreId, statut)]));

      it("enregistre le centre ARCHIVE, daté par l'horloge", async () => {
        await archiverCentre.execute({ centreId });

        const enregistre = await centreRepository.get(centreId);
        expect(enregistre?.statut).toBe(StatutCentre.ARCHIVE);
        expect(enregistre?.modifieLe).toEqual(maintenant);
      });

      it('valide la transaction une seule fois', async () => {
        await archiverCentre.execute({ centreId });

        expect(unitOfWork.nombreDeCommits).toBe(1);
      });
    },
  );

  describe.each([StatutMagasin.ACTIF, StatutMagasin.INACTIF])(
    'centre qui a encore un magasin %s (RDC-REF-011)',
    (statutMagasin) => {
      beforeEach(() =>
        preparer(
          [unCentreExistant(centreId, StatutCentre.ACTIF)],
          [unMagasinExistant(magasinId, statutMagasin)],
        ),
      );

      it('est refusé avec CentreADesMagasins', async () => {
        await expect(archiverCentre.execute({ centreId })).rejects.toThrow(
          CentreADesMagasins,
        );
      });

      it('laisse le centre dans son statut et ne valide rien', async () => {
        await archiverCentre.execute({ centreId }).catch(() => undefined);

        expect((await centreRepository.get(centreId))?.statut).toBe(
          StatutCentre.ACTIF,
        );
        expect(unitOfWork.nombreDeCommits).toBe(0);
      });
    },
  );

  describe('centre dont tous les magasins sont archivés', () => {
    beforeEach(() =>
      preparer(
        [unCentreExistant(centreId, StatutCentre.ACTIF)],
        [unMagasinExistant(magasinId, StatutMagasin.ARCHIVE)],
      ),
    );

    it('est archivé', async () => {
      await archiverCentre.execute({ centreId });

      expect((await centreRepository.get(centreId))?.statut).toBe(
        StatutCentre.ARCHIVE,
      );
    });
  });

  describe('centre déjà archivé', () => {
    const centreArchive = unCentreExistant(centreId, StatutCentre.ARCHIVE);

    beforeEach(() => preparer([centreArchive]));

    it('réussit sans changer la date de modification', async () => {
      await archiverCentre.execute({ centreId });

      const enregistre = await centreRepository.get(centreId);
      expect(enregistre?.statut).toBe(StatutCentre.ARCHIVE);
      expect(enregistre?.modifieLe).toEqual(centreArchive.modifieLe);
    });

    it('valide la transaction comme un archivage ordinaire', async () => {
      await archiverCentre.execute({ centreId });

      expect(unitOfWork.nombreDeCommits).toBe(1);
    });
  });

  describe('centre inconnu', () => {
    beforeEach(() => preparer([]));

    it('est refusé avec CentreIntrouvable', async () => {
      await expect(archiverCentre.execute({ centreId })).rejects.toThrow(
        CentreIntrouvable,
      );
    });

    it('ne valide aucune transaction', async () => {
      await archiverCentre.execute({ centreId }).catch(() => undefined);

      expect(unitOfWork.nombreDeCommits).toBe(0);
    });
  });
});
