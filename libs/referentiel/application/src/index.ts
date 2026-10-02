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
  ModifierMagasinCommande,
} from './magasin/commandes';
export { CreerMagasinUseCase } from './magasin/creer-magasin.use-case';
export { DesactiverMagasinUseCase } from './magasin/desactiver-magasin.use-case';
export { ActiverMagasinUseCase } from './magasin/activer-magasin.use-case';
export { ArchiverMagasinUseCase } from './magasin/archiver-magasin.use-case';
export { ModifierMagasinUseCase } from './magasin/modifier-magasin.use-case';
export {
  LecturesMagasins,
  type VueMagasin,
} from './magasin/lectures/lectures-magasins';
export { ListerMagasinsQuery } from './magasin/lectures/lister-magasins.query';
export {
  ListerMagasinsDuCentreQuery,
  type ListerMagasinsDuCentreRequete,
} from './magasin/lectures/lister-magasins-du-centre.query';
export {
  ObtenirMagasinQuery,
  type ObtenirMagasinRequete,
} from './magasin/lectures/obtenir-magasin.query';

// Produit
export type {
  ChangerActiviteProduitCommande,
  CreerProduitCommande,
  ModifierProduitCommande,
} from './produit/commandes';
export { CreerProduitUseCase } from './produit/creer-produit.use-case';
export { ModifierProduitUseCase } from './produit/modifier-produit.use-case';
export { DesactiverProduitUseCase } from './produit/desactiver-produit.use-case';
export { ActiverProduitUseCase } from './produit/activer-produit.use-case';
export {
  LecturesProduits,
  type VueProduit,
} from './produit/lectures/lectures-produits';
export { ListerProduitsQuery } from './produit/lectures/lister-produits.query';

// Commun au contexte
export {
  CentreDejaExistant,
  CentreIntrouvable,
  MagasinIntrouvable,
  ProduitIntrouvable,
} from './errors';
export { GenerateurIdentifiants } from './ports/generateur-identifiants';
