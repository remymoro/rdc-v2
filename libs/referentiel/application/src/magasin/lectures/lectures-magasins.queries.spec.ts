import { CentreId, MagasinId, StatutMagasin } from '@rdc/referentiel-domain';
import { MagasinIntrouvable } from '../../errors';
import { LecturesMagasinsEnMemoire } from '../../testing/lectures-magasins-en-memoire.test-utils';
import { unMagasinExistant } from '../../testing/magasin-existant.test-utils';
import { ListerMagasinsDuCentreQuery } from './lister-magasins-du-centre.query';
import { ListerMagasinsQuery } from './lister-magasins.query';
import { ObtenirMagasinQuery } from './obtenir-magasin.query';

describe('requêtes de lecture des magasins', () => {
  const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
  // Centre de rattachement de unMagasinExistant.
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');
  const lectures = new LecturesMagasinsEnMemoire([
    unMagasinExistant(magasinId, StatutMagasin.ACTIF),
  ]);

  it('ListerMagasinsQuery renvoie tous les magasins', async () => {
    const vues = await new ListerMagasinsQuery(lectures).execute();

    expect(vues.map((v) => v.id)).toEqual([magasinId.valeur]);
  });

  it('ListerMagasinsDuCentreQuery renvoie les magasins du centre demandé', async () => {
    const query = new ListerMagasinsDuCentreQuery(lectures);

    expect((await query.execute({ centreId })).map((v) => v.id)).toEqual([
      magasinId.valeur,
    ]);
    expect(
      await query.execute({
        centreId: CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b'),
      }),
    ).toEqual([]);
  });

  it('ObtenirMagasinQuery renvoie la vue du magasin', async () => {
    const vue = await new ObtenirMagasinQuery(lectures).execute({ magasinId });

    expect(vue.id).toBe(magasinId.valeur);
  });

  it('ObtenirMagasinQuery refuse un magasin inconnu (MAGASIN_NOT_FOUND)', async () => {
    const inconnu = MagasinId.creer('5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c');

    const erreur = await new ObtenirMagasinQuery(lectures)
      .execute({ magasinId: inconnu })
      .catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(MagasinIntrouvable);
    expect(erreur).toMatchObject({
      code: 'MAGASIN_NOT_FOUND',
      magasinId: inconnu,
    });
  });
});
