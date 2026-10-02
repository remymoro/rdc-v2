import { CentreId } from '@rdc/referentiel-domain';
import { verifierContratLecturesMagasins } from '../magasin/lectures/lectures-magasins.contrat.test-utils';
import { LecturesMagasinsEnMemoire } from './lectures-magasins-en-memoire.test-utils';

verifierContratLecturesMagasins('LecturesMagasinsEnMemoire', async () => {
  const lectures = new LecturesMagasinsEnMemoire();
  return {
    lectures,
    centres: [
      CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12'),
      CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b'),
    ],
    enregistrer: async (magasins) => lectures.enregistrer(magasins),
    nettoyer: async () => undefined,
  };
});
