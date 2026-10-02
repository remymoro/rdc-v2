import {
  FichierImage,
  type ImageMagasin,
  MagasinId,
  MagasinRepository,
} from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { MagasinIntrouvable } from '../errors';
import { GenerateurIdentifiants } from '../ports/generateur-identifiants';
import { Journal } from '../ports/journal';
import { StockageImages } from '../ports/stockage-images';
import type { AjouterImageMagasinCommande } from './commandes';

/**
 * Ajoute une image à un magasin (RDC-REF-007). Base et disque n'ont pas de
 * transaction commune : la base fait foi. Le fichier est écrit d'abord, puis
 * l'image est enregistrée et la transaction validée. Si la transaction
 * échoue, le fichier est supprimé ; si cette suppression échoue aussi, le
 * fichier reste orphelin (journalisé, supprimé plus tard par le nettoyage).
 */
export class AjouterImageMagasinUseCase {
  constructor(
    private readonly magasinRepository: MagasinRepository,
    private readonly stockageImages: StockageImages,
    private readonly generateurIdentifiants: GenerateurIdentifiants,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    private readonly journal: Journal,
  ) {}

  async execute(commande: AjouterImageMagasinCommande): Promise<ImageMagasin> {
    const maintenant = this.clock.now();
    let fichierEcrit: FichierImage | null = null;

    try {
      return await this.unitOfWork.run(async () => {
        const magasin = await this.magasinRepository.get(commande.magasinId);
        if (magasin === null) {
          throw new MagasinIntrouvable(commande.magasinId);
        }

        // Nom généré, extension du format reconnu : jamais le nom du client.
        const id = this.generateurIdentifiants.nouvelleImageMagasinId();
        const fichier = FichierImage.pour(id, commande.contenu.format);
        const image = magasin.ajouterImage({ id, fichier }, maintenant);

        await this.stockageImages.enregistrer(
          magasin.id,
          fichier,
          commande.contenu,
        );
        fichierEcrit = fichier;

        await this.magasinRepository.save(magasin);
        await this.unitOfWork.commit();
        return image;
      });
    } catch (erreur) {
      if (fichierEcrit !== null) {
        await this.supprimerLeFichierEcrit(commande.magasinId, fichierEcrit);
      }
      throw erreur; // L'échec d'origine reste visible (TENETS-UOW-010).
    }
  }

  /** Compensation : un échec ici ne masque jamais l'échec de la transaction. */
  private async supprimerLeFichierEcrit(
    magasinId: MagasinId,
    fichier: FichierImage,
  ): Promise<void> {
    try {
      await this.stockageImages.supprimer(magasinId, fichier);
    } catch (erreurSuppression) {
      this.journal.avertir(
        "Image non enregistrée : son fichier n'a pas pu être supprimé et reste orphelin jusqu'au prochain nettoyage.",
        { magasinId: magasinId.valeur, fichier: fichier.valeur },
        erreurSuppression,
      );
    }
  }
}
