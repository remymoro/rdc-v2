import { CentreId, StatutCentre } from '@rdc/referentiel-domain';
import { CentreIntrouvable } from '../../errors';
import { unCentreExistant } from '../../testing/centre-existant.test-utils';
import { LecturesCentresEnMemoire } from '../../testing/lectures-centres-en-memoire.test-utils';
import type { FiltreCentres } from './lectures-centres';
import { ListerCentresQuery } from './lister-centres.query';
import { ObtenirCentreQuery } from './obtenir-centre.query';

describe('requêtes de lecture des centres', () => {
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');
  const lectures = new LecturesCentresEnMemoire([
    unCentreExistant(centreId, StatutCentre.ACTIF),
  ]);

  describe('ListerCentresQuery', () => {
    it('renvoie tous les centres sans critère', async () => {
      const vues = await new ListerCentresQuery(lectures).execute({});

      expect(vues.map((v) => v.id)).toEqual([centreId.valeur]);
    });

    it('transmet le statut et la recherche nettoyée', async () => {
      const espion = jest.spyOn(lectures, 'list');

      await new ListerCentresQuery(lectures).execute({
        statut: StatutCentre.INACTIF,
        recherche: '  agen ',
      });

      expect(espion).toHaveBeenLastCalledWith<[FiltreCentres]>({
        statut: StatutCentre.INACTIF,
        recherche: 'agen',
      });
    });

    it.each(['', '   '])(
      'ignore une recherche vide (%j)',
      async (recherche) => {
        const espion = jest.spyOn(lectures, 'list');

        await new ListerCentresQuery(lectures).execute({ recherche });

        expect(espion).toHaveBeenLastCalledWith<[FiltreCentres]>({});
      },
    );
  });

  describe('ObtenirCentreQuery', () => {
    it('renvoie la vue du centre', async () => {
      const vue = await new ObtenirCentreQuery(lectures).execute({ centreId });

      expect(vue.id).toBe(centreId.valeur);
    });

    it('refuse un centre inconnu (CENTRE_NOT_FOUND)', async () => {
      const inconnu = CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b');

      await expect(
        new ObtenirCentreQuery(lectures).execute({ centreId: inconnu }),
      ).rejects.toThrow(CentreIntrouvable);
    });
  });
});
