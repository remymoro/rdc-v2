import {
  CentreRepository,
  MagasinRepository,
  StatutCentre,
} from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import type { ArchiverCentreCommande } from './commandes';
import { CentreADesMagasins, CentreIntrouvable } from '../errors';

/**
 * Archive un centre qui n'a plus de magasin ACTIF ni INACTIF (RDC-REF-011).
 * Classe simple, sans NestJS : câblée par le module du contexte (TENETS-COMPOSE-001).
 */
export class ArchiverCentreUseCase {
  constructor(
    private readonly centreRepository: CentreRepository,
    private readonly magasinRepository: MagasinRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: ArchiverCentreCommande): Promise<void> {
    await this.unitOfWork.run(async () => {
      const centre = await this.centreRepository.get(commande.centreId);
      if (centre === null) {
        throw new CentreIntrouvable(commande.centreId);
      }
      // Un centre déjà archivé le reste : archiver est alors sans effet.
      if (
        centre.statut !== StatutCentre.ARCHIVE &&
        (await this.magasinRepository.existsNonArchiveDuCentre(centre.id))
      ) {
        throw new CentreADesMagasins(centre.id);
      }
      centre.archiver(this.clock.now());
      await this.centreRepository.save(centre);
      await this.unitOfWork.commit();
    });
  }
}
