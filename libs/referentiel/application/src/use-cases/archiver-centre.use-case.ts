import { CentreRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import type { ArchiverCentreCommande } from '../commands';
import { CentreIntrouvable } from '../errors';

/** Classe simple, sans NestJS : câblée par le module du contexte (TENETS-COMPOSE-001). */
export class ArchiverCentreUseCase {
  constructor(
    private readonly centreRepository: CentreRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: ArchiverCentreCommande): Promise<void> {
    await this.unitOfWork.run(async () => {
      const centre = await this.centreRepository.get(commande.centreId);
      if (centre === null) {
        throw new CentreIntrouvable(commande.centreId);
      }
      centre.archiver(this.clock.now());
      await this.centreRepository.save(centre);
      await this.unitOfWork.commit();
    });
  }
}
