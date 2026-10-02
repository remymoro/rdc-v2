import { Centre, CentreId, StatutCentre } from '@rdc/referentiel-domain';
import { CentreIntrouvable } from '../errors';
import { unCentreExistant } from '../testing/centre-existant.test-utils';
import { CentreRepositoryEnMemoire } from '../testing/centre-repository-en-memoire.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import { ArchiverCentreUseCase } from './archiver-centre.use-case';

describe('ArchiverCentreUseCase', () => {
  const maintenant = new Date('2026-10-02T14:30:00.000Z');
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');

  let centreRepository: CentreRepositoryEnMemoire;
  let unitOfWork: UnitOfWorkEspion;
  let archiverCentre: ArchiverCentreUseCase;

  function preparer(centres: Centre[]): void {
    centreRepository = new CentreRepositoryEnMemoire(centres);
    unitOfWork = new UnitOfWorkEspion();
    archiverCentre = new ArchiverCentreUseCase(
      centreRepository,
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
