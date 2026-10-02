import {
  CentreRepository,
  CleDoublonMagasin,
  Magasin,
  MagasinDejaExistant,
  MagasinRepository,
} from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import type { CreerMagasinCommande } from './commandes';
import { CentreIntrouvable } from '../errors';
import { GenerateurIdentifiants } from '../ports/generateur-identifiants';

/**
 * Crée un magasin rattaché à un centre existant et ACTIF (RDC-REF-005, 010),
 * sans doublon (RDC-REF-001). Le centre est lu par le repository du même
 * contexte : pas de contrat publié à l'intérieur de `referentiel`.
 */
export class CreerMagasinUseCase {
  constructor(
    private readonly magasinRepository: MagasinRepository,
    private readonly centreRepository: CentreRepository,
    private readonly generateurIdentifiants: GenerateurIdentifiants,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: CreerMagasinCommande): Promise<Magasin> {
    const magasin = Magasin.creer(
      { id: this.generateurIdentifiants.nouveauMagasinId(), ...commande },
      this.clock.now(),
    );

    await this.unitOfWork.run(async () => {
      const centre = await this.centreRepository.get(commande.centreId);
      if (centre === null) {
        throw new CentreIntrouvable(commande.centreId);
      }
      centre.verifierOuvertAuxRattachements();

      const cle = CleDoublonMagasin.depuis(magasin);
      if (await this.magasinRepository.existsByCleDoublon(cle)) {
        throw new MagasinDejaExistant();
      }
      await this.magasinRepository.save(magasin);
      await this.unitOfWork.commit();
    });

    return magasin;
  }
}
