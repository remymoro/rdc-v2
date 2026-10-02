import { verifierContratLecturesCentres } from '../centre/lectures/lectures-centres.contrat.test-utils';
import { LecturesCentresEnMemoire } from './lectures-centres-en-memoire.test-utils';

verifierContratLecturesCentres('LecturesCentresEnMemoire', async () => {
  const lectures = new LecturesCentresEnMemoire();
  return {
    lectures,
    enregistrer: async (centres, magasins = []) =>
      lectures.enregistrer(centres, magasins),
    nettoyer: async () => undefined,
  };
});
