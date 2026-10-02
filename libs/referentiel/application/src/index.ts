// API publique de la couche application, regroupée par agrégat.

// Centre
export type {
  ActiverCentreCommande,
  ArchiverCentreCommande,
  CreerCentreCommande,
  DesactiverCentreCommande,
} from './centre/commandes';
export { CreerCentreUseCase } from './centre/creer-centre.use-case';
export { DesactiverCentreUseCase } from './centre/desactiver-centre.use-case';
export { ActiverCentreUseCase } from './centre/activer-centre.use-case';
export { ArchiverCentreUseCase } from './centre/archiver-centre.use-case';

// Magasin
export type {
  ActiverMagasinCommande,
  ArchiverMagasinCommande,
  CreerMagasinCommande,
  DesactiverMagasinCommande,
} from './magasin/commandes';
export { CreerMagasinUseCase } from './magasin/creer-magasin.use-case';
export { DesactiverMagasinUseCase } from './magasin/desactiver-magasin.use-case';
export { ActiverMagasinUseCase } from './magasin/activer-magasin.use-case';
export { ArchiverMagasinUseCase } from './magasin/archiver-magasin.use-case';

// Commun au contexte
export {
  CentreDejaExistant,
  CentreIntrouvable,
  MagasinIntrouvable,
} from './errors';
export { GenerateurIdentifiants } from './ports/generateur-identifiants';
