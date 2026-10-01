// Point d'entrée des outils de test de la lib, importé via
// « @rdc/referentiel-domain/testing ». Exclu du build (*.test-utils.ts).
export {
  verifierContratCentreRepository,
  type ContexteContratCentreRepository,
} from './ports/centre.repository.contrat.test-utils';
export {
  verifierContratMagasinRepository,
  type ContexteContratMagasinRepository,
} from './ports/magasin.repository.contrat.test-utils';
