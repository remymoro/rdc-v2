import { CentreRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import type { DesactiverCentreCommande } from '../commands';
import { CentreIntrouvable } from '../errors';

/** Classe simple, sans NestJS : câblée par le module du contexte (TENETS-COMPOSE-001). */
export class DesactiverCentreUseCase {
  constructor(
    private readonly centreRepository: CentreRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: DesactiverCentreCommande): Promise<void> {
    await this.unitOfWork.run(async () => {
      const centre = await this.centreRepository.get(commande.centreId);
      if (centre === null) {
        throw new CentreIntrouvable(commande.centreId);
      }
      centre.desactiver(this.clock.now());
      await this.centreRepository.save(centre);
      await this.unitOfWork.commit();
    });
  }
}
