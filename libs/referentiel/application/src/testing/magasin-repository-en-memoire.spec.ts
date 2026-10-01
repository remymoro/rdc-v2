import { CentreId } from '@rdc/referentiel-domain';
import { verifierContratMagasinRepository } from '@rdc/referentiel-domain/testing';
import { MagasinRepositoryEnMemoire } from './magasin-repository-en-memoire.test-utils';

// Le fake des tests de use case respecte le même contrat que Prisma.
verifierContratMagasinRepository('MagasinRepositoryEnMemoire', async () => ({
  repository: new MagasinRepositoryEnMemoire(),
  centreId: CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12'),
  nettoyer: async () => undefined,
}));
