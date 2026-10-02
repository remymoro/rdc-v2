import { verifierContratProduitRepository } from '@rdc/referentiel-domain/testing';
import { ProduitRepositoryEnMemoire } from './produit-repository-en-memoire.test-utils';

verifierContratProduitRepository('ProduitRepositoryEnMemoire', async () => ({
  repository: new ProduitRepositoryEnMemoire(),
  nettoyer: async () => undefined,
}));
