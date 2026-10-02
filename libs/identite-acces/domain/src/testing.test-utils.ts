// Point d'entrée des outils de test de la lib, importé via
// « @rdc/identite-acces-domain/testing ». Exclu du build (*.test-utils.ts).
export {
  verifierContratUtilisateurRepository,
  type ContexteContratUtilisateurRepository,
} from './ports/utilisateur.repository.contrat.test-utils';
