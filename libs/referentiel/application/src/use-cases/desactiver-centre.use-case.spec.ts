import {
  Adresse,
  Centre,
  CentreArchive,
  CentreId,
  CodePostal,
  Nom,
  StatutCentre,
  Ville,
} from '@rdc/referentiel-domain';
import { CentreIntrouvable } from '../errors';
import { CentreRepositoryEnMemoire } from '../testing/centre-repository-en-memoire.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import { DesactiverCentreUseCase } from './desactiver-centre.use-case';

describe('DesactiverCentreUseCase', () => {
  const maintenant = new Date('2026-10-02T14:30:00.000Z');
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');

  let centreRepository: CentreRepositoryEnMemoire;
  let unitOfWork: UnitOfWorkEspion;
  let desactiverCentre: DesactiverCentreUseCase;

  function preparer(centres: Centre[]): void {
    centreRepository = new CentreRepositoryEnMemoire(centres);
    unitOfWork = new UnitOfWorkEspion();
    desactiverCentre = new DesactiverCentreUseCase(
      centreRepository,
      unitOfWork,
      new HorlogeFixe(maintenant),
    );
  }

  describe('centre actif', () => {
    beforeEach(() => preparer([unCentre(StatutCentre.ACTIF)]));

    it("enregistre le centre INACTIF, daté par l'horloge", async () => {
      await desactiverCentre.execute({ centreId });

      const enregistre = await centreRepository.get(centreId);
      expect(enregistre?.statut).toBe(StatutCentre.INACTIF);
      expect(enregistre?.modifieLe).toEqual(maintenant);
    });

    it('valide la transaction une seule fois', async () => {
      await desactiverCentre.execute({ centreId });

      expect(unitOfWork.nombreDeCommits).toBe(1);
    });
  });

  describe('centre inconnu', () => {
    beforeEach(() => preparer([]));

    it('est refusé avec CentreIntrouvable', async () => {
      await expect(desactiverCentre.execute({ centreId })).rejects.toThrow(
        CentreIntrouvable,
      );
    });

    it('ne valide aucune transaction', async () => {
      await desactiverCentre.execute({ centreId }).catch(() => undefined);

      expect(unitOfWork.nombreDeCommits).toBe(0);
    });
  });

  describe('centre archivé', () => {
    beforeEach(() => preparer([unCentre(StatutCentre.ARCHIVE)]));

    it("laisse passer l'erreur du domaine CentreArchive", async () => {
      await expect(desactiverCentre.execute({ centreId })).rejects.toThrow(
        CentreArchive,
      );
    });

    it('ne modifie rien et ne valide aucune transaction', async () => {
      await desactiverCentre.execute({ centreId }).catch(() => undefined);

      expect((await centreRepository.get(centreId))?.statut).toBe(
        StatutCentre.ARCHIVE,
      );
      expect(unitOfWork.nombreDeCommits).toBe(0);
    });
  });

  function unCentre(statut: StatutCentre): Centre {
    return Centre.reconstituer({
      id: centreId,
      nom: Nom.creer("Centre d'Agen"),
      adresse: Adresse.creer('12 avenue Jean Jaurès'),
      codePostal: CodePostal.creer('47000'),
      ville: Ville.creer('Agen'),
      statut,
      creeLe: new Date('2026-10-01T09:00:00.000Z'),
      modifieLe: new Date('2026-10-01T09:00:00.000Z'),
    });
  }
});
