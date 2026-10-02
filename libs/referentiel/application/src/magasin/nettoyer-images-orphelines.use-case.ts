import { MagasinRepository } from '@rdc/referentiel-domain';
import { Clock } from '@rdc/shared-kernel-application';
import { Journal } from '../ports/journal';
import {
  type FichierImageStocke,
  StockageImages,
} from '../ports/stockage-images';

/**
 * Âge minimal d'un orphelin supprimé : un fichier plus récent appartient
 * peut-être à un ajout dont la transaction n'est pas encore validée.
 */
export const AGE_MINIMAL_ORPHELIN_MS = 60 * 60 * 1000;

/** Résultat d'un passage du nettoyage. */
export interface BilanNettoyageImages {
  readonly supprimes: number;
  readonly echecs: number;
}

/**
 * Supprime les fichiers d'images sans image en base, âgés d'au moins une
 * heure (RDC-REF-007, la base fait foi). Idempotent : un passage suivant ne
 * trouve plus rien. Un échec de suppression est journalisé, et le fichier
 * sera retenté au passage suivant. Lectures seules en base : pas d'unité de
 * travail (TENETS-UOW-011).
 */
export class NettoyerImagesOrphelinesUseCase {
  constructor(
    private readonly magasinRepository: MagasinRepository,
    private readonly stockageImages: StockageImages,
    private readonly clock: Clock,
    private readonly journal: Journal,
  ) {}

  async execute(): Promise<BilanNettoyageImages> {
    const limite = this.clock.now().getTime() - AGE_MINIMAL_ORPHELIN_MS;
    const anciens = (await this.stockageImages.lister()).filter(
      (stocke) => stocke.modifieLe.getTime() <= limite,
    );

    let supprimes = 0;
    let echecs = 0;
    for (const fichiers of parMagasin(anciens)) {
      const magasinId = fichiers[0].magasinId;
      const magasin = await this.magasinRepository.get(magasinId);
      if (magasin === null) {
        // Un magasin n'est jamais supprimé : son absence signale une base
        // vide, en cours de reprise ou qui n'est pas celle du dossier.
        // Rien n'est effacé (ADR-0021).
        this.journal.avertir(
          "Nettoyage des images : dossier d'un magasin inconnu en base, fichiers conservés.",
          { magasinId: magasinId.valeur },
        );
        continue;
      }
      const references = new Set(
        magasin.images.map((image) => image.fichier.valeur),
      );

      for (const { fichier } of fichiers) {
        if (references.has(fichier.valeur)) {
          continue;
        }
        try {
          await this.stockageImages.supprimer(magasinId, fichier);
          supprimes += 1;
        } catch (erreur) {
          // Pas bloquant : réessayé au prochain passage.
          echecs += 1;
          this.journal.avertir(
            "Nettoyage des images : un fichier orphelin n'a pas pu être supprimé, nouvel essai au prochain passage.",
            { magasinId: magasinId.valeur, fichier: fichier.valeur },
            erreur,
          );
        }
      }
    }
    return { supprimes, echecs };
  }
}

/** Un groupe non vide de fichiers par magasin : un seul chargement chacun. */
function parMagasin(
  fichiers: readonly FichierImageStocke[],
): [FichierImageStocke, ...FichierImageStocke[]][] {
  const groupes = new Map<
    string,
    [FichierImageStocke, ...FichierImageStocke[]]
  >();
  for (const fichier of fichiers) {
    const groupe = groupes.get(fichier.magasinId.valeur);
    if (groupe === undefined) {
      groupes.set(fichier.magasinId.valeur, [fichier]);
    } else {
      groupe.push(fichier);
    }
  }
  return [...groupes.values()];
}
