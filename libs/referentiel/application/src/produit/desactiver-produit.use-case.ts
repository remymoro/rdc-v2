import { ProduitRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { ProduitIntrouvable } from '../errors';
import type { ChangerActiviteProduitCommande } from './commandes';

/** Retire un produit des choix proposés, sans le supprimer (RDC-REF-008). */
export class DesactiverProduitUseCase {
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
      produit.desactiver(this.clock.now());
      await this.produitRepository.save(produit);
      await this.unitOfWork.commit();
    });
  }
}
