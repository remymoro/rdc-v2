import { verifierContratCentreRepository } from '@rdc/referentiel-domain/testing';
import { CentreRepositoryEnMemoire } from './centre-repository-en-memoire.test-utils';

// Le fake utilisé par les tests de use case respecte le même contrat que
// l'implémentation Prisma : ces tests restent donc valables en production.
verifierContratCentreRepository('CentreRepositoryEnMemoire', async () => ({
  repository: new CentreRepositoryEnMemoire(),
  nettoyer: async () => undefined,
}));
