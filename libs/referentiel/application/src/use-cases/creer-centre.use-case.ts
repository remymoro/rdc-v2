import { Centre, CentreRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import type { CreerCentreCommande } from '../commands';
import { GenerateurIdentifiants } from '../ports/generateur-identifiants';

/** Classe simple, sans NestJS : câblée par le module du contexte (TENETS-COMPOSE-001). */
export class CreerCentreUseCase {
  constructor(
    private readonly centreRepository: CentreRepository,
    private readonly generateurIdentifiants: GenerateurIdentifiants,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: CreerCentreCommande): Promise<Centre> {
    const centre = Centre.creer(
      { id: this.generateurIdentifiants.nouveauCentreId(), ...commande },
      this.clock.now(),
    );

    await this.unitOfWork.run(async () => {
      await this.centreRepository.save(centre);
      await this.unitOfWork.commit();
    });

    return centre;
  }
}
