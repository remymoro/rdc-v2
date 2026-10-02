import { MagasinRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { MagasinIntrouvable } from '../errors';
import type { DesactiverMagasinCommande } from './commandes';

/** Met un magasin en pause (RDC-REF-002). Classe simple, câblée par le module du contexte. */
export class DesactiverMagasinUseCase {
  constructor(
    private readonly magasinRepository: MagasinRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: DesactiverMagasinCommande): Promise<void> {
    await this.unitOfWork.run(async () => {
      const magasin = await this.magasinRepository.get(commande.magasinId);
      if (magasin === null) {
        throw new MagasinIntrouvable(commande.magasinId);
      }
      magasin.desactiver(this.clock.now());
      await this.magasinRepository.save(magasin);
      await this.unitOfWork.commit();
    });
  }
}
