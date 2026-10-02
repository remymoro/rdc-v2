import {
  CentreDejaExistant,
  Centre,
  CentreRepository,
  CleDoublonCentre,
} from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { CentreIntrouvable } from '../errors';
import type { ModifierCentreCommande } from './commandes';

/**
 * Modifie l'identité ou les contacts d'un centre, sans créer de doublon
 * (RDC-REF-001) ; un centre archivé est refusé par le domaine (RDC-REF-002).
 * Une erreur interrompt l'unité de travail avant l'enregistrement, et
 * l'agrégat modifié en mémoire est abandonné.
 */
export class ModifierCentreUseCase {
  constructor(
    private readonly centreRepository: CentreRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: ModifierCentreCommande): Promise<Centre> {
    const maintenant = this.clock.now();

    return this.unitOfWork.run(async () => {
      const centre = await this.centreRepository.get(commande.centreId);
      if (centre === null) {
        throw new CentreIntrouvable(commande.centreId);
      }
      const cleAvant = CleDoublonCentre.depuis(centre);

      centre.modifier(commande.changements, maintenant);

      // Seul ce centre porte sa clé actuelle (unicité) : on ne cherche un
      // doublon que si la clé change.
      const cleApres = CleDoublonCentre.depuis(centre);
      if (
        !cleApres.equals(cleAvant) &&
        (await this.centreRepository.existsByCleDoublon(cleApres))
      ) {
        throw new CentreDejaExistant();
      }

      await this.centreRepository.save(centre);
      await this.unitOfWork.commit();
      return centre;
    });
  }
}
