import { Produit, ProduitRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { GenerateurIdentifiants } from '../ports/generateur-identifiants';
import type { CreerProduitCommande } from './commandes';

/**
 * Ajoute un produit au catalogue (RDC-REF-008). Pas de contrôle d'unicité du
 * code : la v1 l'a retiré volontairement (migration remove_produit_code_unique).
 */
export class CreerProduitUseCase {
  constructor(
    private readonly produitRepository: ProduitRepository,
    private readonly generateurIdentifiants: GenerateurIdentifiants,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(commande: CreerProduitCommande): Promise<Produit> {
    const produit = Produit.creer(
      { id: this.generateurIdentifiants.nouveauProduitId(), ...commande },
      this.clock.now(),
    );

    await this.unitOfWork.run(async () => {
      await this.produitRepository.save(produit);
      await this.unitOfWork.commit();
    });

    return produit;
  }
}
