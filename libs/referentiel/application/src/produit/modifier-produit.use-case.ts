import { Produit, ProduitRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { ProduitIntrouvable } from '../errors';
import type { ModifierProduitCommande } from './commandes';

/** Corrige le code ou le classement d'un produit (RDC-REF-008). */
export class ModifierProduitUseCase {
  constructor(
    private readonly produitRepository: ProduitRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: ModifierProduitCommande): Promise<Produit> {
    return this.unitOfWork.run(async () => {
      const produit = await this.produitRepository.get(commande.produitId);
      if (produit === null) {
        throw new ProduitIntrouvable(commande.produitId);
      }
      produit.modifier(commande.changements, this.clock.now());
      await this.produitRepository.save(produit);
      await this.unitOfWork.commit();
      return produit;
    });
  }
}
