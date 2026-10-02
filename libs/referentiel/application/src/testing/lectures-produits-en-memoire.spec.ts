import { verifierContratLecturesProduits } from '../produit/lectures/lectures-produits.contrat.test-utils';
import { LecturesProduitsEnMemoire } from './lectures-produits-en-memoire.test-utils';

verifierContratLecturesProduits('LecturesProduitsEnMemoire', async () => {
  const lectures = new LecturesProduitsEnMemoire();
  return {
    lectures,
    enregistrer: async (produits) => lectures.enregistrer(produits),
    nettoyer: async () => undefined,
  };
});
