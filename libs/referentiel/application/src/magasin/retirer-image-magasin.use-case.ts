import { MagasinRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { MagasinIntrouvable } from '../errors';
import { Journal } from '../ports/journal';
import { StockageImages } from '../ports/stockage-images';
import type { RetirerImageMagasinCommande } from './commandes';

/**
 * Retire une image d'un magasin (RDC-REF-007). La base fait foi : l'image est
 * retirée en base et la transaction validée, **puis** le fichier est supprimé.
 * Si la transaction échoue, le fichier n'est pas touché. Si la suppression du
 * fichier échoue, le retrait reste acquis : le fichier devient orphelin,
 * l'échec est journalisé et le nettoyage le supprimera.
 */
export class RetirerImageMagasinUseCase {
  constructor(
    private readonly magasinRepository: MagasinRepository,
    private readonly stockageImages: StockageImages,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    private readonly journal: Journal,
  ) {}

  async execute(commande: RetirerImageMagasinCommande): Promise<void> {
    const maintenant = this.clock.now();

    const image = await this.unitOfWork.run(async () => {
      const magasin = await this.magasinRepository.get(commande.magasinId);
      if (magasin === null) {
        throw new MagasinIntrouvable(commande.magasinId);
      }
      const retiree = magasin.retirerImage(commande.imageId, maintenant);
      await this.magasinRepository.save(magasin);
      await this.unitOfWork.commit();
      return retiree;
    });

    try {
      await this.stockageImages.supprimer(commande.magasinId, image.fichier);
    } catch (erreur) {
      // Compensation volontairement large : le retrait est validé en base,
      // un fichier restant n'est qu'un orphelin à nettoyer (ADR-0021).
      this.journal.avertir(
        "Image retirée : son fichier n'a pas pu être supprimé et reste orphelin jusqu'au prochain nettoyage.",
        {
          magasinId: commande.magasinId.valeur,
          fichier: image.fichier.valeur,
        },
        erreur,
      );
    }
  }
}
