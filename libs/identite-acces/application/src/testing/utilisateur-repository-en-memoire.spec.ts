import { CentreId } from '@rdc/identite-acces-domain';
import { verifierContratUtilisateurRepository } from '@rdc/identite-acces-domain/testing';
import { UtilisateurRepositoryEnMemoire } from './utilisateur-repository-en-memoire.test-utils';

// Le fake utilisé par les tests de use case respecte le même contrat que
// l'implémentation Prisma : ces tests restent donc valables en production.
verifierContratUtilisateurRepository(
  'UtilisateurRepositoryEnMemoire',
  async () => ({
    repository: new UtilisateurRepositoryEnMemoire(),
    centreId: CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12'),
    nettoyer: async () => undefined,
  }),
);
