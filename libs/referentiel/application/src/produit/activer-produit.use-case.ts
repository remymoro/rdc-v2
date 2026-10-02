import { ProduitRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { ProduitIntrouvable } from '../errors';
import type { ChangerActiviteProduitCommande } from './commandes';

/** Remet un produit désactivé dans le catalogue utilisé (RDC-REF-008). */
export class ActiverProduitUseCase {
  constructor(
    private readonly produitRepository: ProduitRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: ChangerActiviteProduitCommande): Promise<void> {
    await this.unitOfWork.run(async () => {
      const produit = await this.produitRepository.get(commande.produitId);
      if (produit === null) {
        throw new ProduitIntrouvable(commande.produitId);
      }
      produit.activer(this.clock.now());
      await this.produitRepository.save(produit);
      await this.unitOfWork.commit();
    });
  }
}
