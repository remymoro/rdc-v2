// Point d'entrée des outils de test de la lib, importé via
// « @rdc/referentiel-application/testing ». Exclu du build (*.test-utils.ts).
export {
  verifierContratLecturesCentres,
  type ContexteContratLecturesCentres,
} from './centre/lectures/lectures-centres.contrat.test-utils';
export {
  verifierContratLecturesMagasins,
  type ContexteContratLecturesMagasins,
} from './magasin/lectures/lectures-magasins.contrat.test-utils';
export {
  verifierContratLecturesProduits,
  type ContexteContratLecturesProduits,
} from './produit/lectures/lectures-produits.contrat.test-utils';
export {
  unContenuJpeg,
  unFichier,
  verifierContratStockageImages,
  type ContexteContratStockageImages,
} from './ports/stockage-images.contrat.test-utils';
export { JournalEnMemoire } from './testing/journal-en-memoire.test-utils';
export { unMagasinExistant } from './testing/magasin-existant.test-utils';
export { MagasinRepositoryEnMemoire } from './testing/magasin-repository-en-memoire.test-utils';
export { StockageImagesEnMemoire } from './testing/stockage-images-en-memoire.test-utils';
