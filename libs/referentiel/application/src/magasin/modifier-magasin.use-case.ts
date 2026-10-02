import {
  CentreRepository,
  CleDoublonMagasin,
  Magasin,
  MagasinDejaExistant,
  MagasinRepository,
} from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { CentreIntrouvable, MagasinIntrouvable } from '../errors';
import type { ModifierMagasinCommande } from './commandes';

/**
 * Modifie un magasin et, si demandé, le transfère vers un autre centre
 * ACTIF (RDC-REF-005, 010), sans créer de doublon (RDC-REF-001). Aucune
 * restauration d'état : une erreur interrompt l'unité de travail avant
 * l'enregistrement, et l'agrégat modifié en mémoire est abandonné.
 */
export class ModifierMagasinUseCase {
  constructor(
    private readonly magasinRepository: MagasinRepository,
    private readonly centreRepository: CentreRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: ModifierMagasinCommande): Promise<Magasin> {
    const maintenant = this.clock.now();

    return this.unitOfWork.run(async () => {
      const magasin = await this.magasinRepository.get(commande.magasinId);
      if (magasin === null) {
        throw new MagasinIntrouvable(commande.magasinId);
      }
      const cleAvant = CleDoublonMagasin.depuis(magasin);

      magasin.modifier(commande.changements, maintenant);

      const centreCible = commande.centreId;
      if (centreCible && !centreCible.equals(magasin.centreId)) {
        const centre = await this.centreRepository.get(centreCible);
        if (centre === null) {
          throw new CentreIntrouvable(centreCible);
        }
        centre.verifierOuvertAuxRattachements();
        magasin.transfererVers(centreCible, maintenant);
      }

      // Seul ce magasin porte sa clé actuelle (unicité) : on ne cherche un
      // doublon que si la clé change.
      const cleApres = CleDoublonMagasin.depuis(magasin);
      if (
        !cleApres.equals(cleAvant) &&
        (await this.magasinRepository.existsByCleDoublon(cleApres))
      ) {
        throw new MagasinDejaExistant();
      }

      await this.magasinRepository.save(magasin);
      await this.unitOfWork.commit();
      return magasin;
    });
  }
}
