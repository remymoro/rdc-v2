import {
  Centre,
  CentreArchive,
  CentreId,
  StatutCentre,
} from '@rdc/referentiel-domain';
import { CentreIntrouvable } from '../errors';
import { CentreRepositoryEnMemoire } from '../testing/centre-repository-en-memoire.test-utils';
import { unCentreExistant } from '../testing/centre-existant.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import { ActiverCentreUseCase } from './activer-centre.use-case';

describe('ActiverCentreUseCase', () => {
  const maintenant = new Date('2026-10-02T14:30:00.000Z');
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');

  let centreRepository: CentreRepositoryEnMemoire;
  let unitOfWork: UnitOfWorkEspion;
  let activerCentre: ActiverCentreUseCase;

  function preparer(centres: Centre[]): void {
    centreRepository = new CentreRepositoryEnMemoire(centres);
    unitOfWork = new UnitOfWorkEspion();
    activerCentre = new ActiverCentreUseCase(
      centreRepository,
      unitOfWork,
      new HorlogeFixe(maintenant),
    );
  }

  describe('centre inactif', () => {
    beforeEach(() =>
      preparer([unCentreExistant(centreId, StatutCentre.INACTIF)]),
    );

    it("enregistre le centre ACTIF, daté par l'horloge", async () => {
      await activerCentre.execute({ centreId });

      const enregistre = await centreRepository.get(centreId);
      expect(enregistre?.statut).toBe(StatutCentre.ACTIF);
      expect(enregistre?.modifieLe).toEqual(maintenant);
    });

    it('valide la transaction une seule fois', async () => {
      await activerCentre.execute({ centreId });

      expect(unitOfWork.nombreDeCommits).toBe(1);
    });
  });

  describe('centre inconnu', () => {
    beforeEach(() => preparer([]));

    it('est refusé avec CentreIntrouvable', async () => {
      await expect(activerCentre.execute({ centreId })).rejects.toThrow(
        CentreIntrouvable,
      );
    });

    it('ne valide aucune transaction', async () => {
      await activerCentre.execute({ centreId }).catch(() => undefined);

      expect(unitOfWork.nombreDeCommits).toBe(0);
    });
  });

  describe('centre archivé', () => {
    beforeEach(() =>
      preparer([unCentreExistant(centreId, StatutCentre.ARCHIVE)]),
    );

    it("laisse passer l'erreur du domaine CentreArchive", async () => {
      await expect(activerCentre.execute({ centreId })).rejects.toThrow(
        CentreArchive,
      );
    });

    it('ne modifie rien et ne valide aucune transaction', async () => {
      await activerCentre.execute({ centreId }).catch(() => undefined);

      expect((await centreRepository.get(centreId))?.statut).toBe(
        StatutCentre.ARCHIVE,
      );
      expect(unitOfWork.nombreDeCommits).toBe(0);
    });
  });
});
