import { ContenuImage, FichierImage, MagasinId } from '@rdc/referentiel-domain';
import type { Clock } from '@rdc/shared-kernel-application';
import {
  type FichierImageStocke,
  StockageImages,
  StockageImagesIndisponible,
} from '../ports/stockage-images';

interface Fichier {
  readonly magasinId: MagasinId;
  readonly fichier: FichierImage;
  readonly octets: Uint8Array;
  readonly modifieLe: Date;
}

/**
 * Fake du port StockageImages (TENETS-TEST-002). Les fichiers sont datés par
 * l'horloge reçue ; les tests peuvent provoquer des pannes ciblées.
 */
export class StockageImagesEnMemoire extends StockageImages {
  private readonly fichiers = new Map<string, Fichier>();
  private readonly suppressionsEnPanne = new Set<string>();
  private enregistrementEnPanne = false;

  constructor(private readonly horloge: Clock) {
    super();
  }

  async enregistrer(
    magasinId: MagasinId,
    fichier: FichierImage,
    contenu: ContenuImage,
  ): Promise<void> {
    if (this.enregistrementEnPanne) {
      throw new StockageImagesIndisponible();
    }
    this.fichiers.set(cle(magasinId, fichier), {
      magasinId,
      fichier,
      octets: Uint8Array.from(contenu.octets),
      modifieLe: this.horloge.now(),
    });
  }

  async supprimer(magasinId: MagasinId, fichier: FichierImage): Promise<void> {
    if (this.suppressionsEnPanne.has(fichier.valeur)) {
      throw new StockageImagesIndisponible();
    }
    this.fichiers.delete(cle(magasinId, fichier));
  }

  async lister(): Promise<readonly FichierImageStocke[]> {
    return [...this.fichiers.values()].map(
      ({ magasinId, fichier, modifieLe }) => ({
        magasinId,
        fichier,
        modifieLe,
      }),
    );
  }

  /** Octets d'un fichier stocké, ou null. */
  contenu(magasinId: MagasinId, fichier: FichierImage): Uint8Array | null {
    return this.fichiers.get(cle(magasinId, fichier))?.octets ?? null;
  }

  /** Noms des fichiers présents, « <magasin>/<fichier> », triés. */
  noms(): string[] {
    return [...this.fichiers.keys()].sort();
  }

  /** Dépose directement un fichier, à la date voulue (orphelin d'un échec passé). */
  deposer(magasinId: MagasinId, fichier: FichierImage, modifieLe: Date): void {
    this.fichiers.set(cle(magasinId, fichier), {
      magasinId,
      fichier,
      octets: new Uint8Array([0xff, 0xd8, 0xff]),
      modifieLe,
    });
  }

  tomberEnPanneAlEnregistrement(): void {
    this.enregistrementEnPanne = true;
  }

  tomberEnPanneALaSuppression(fichier: FichierImage): void {
    this.suppressionsEnPanne.add(fichier.valeur);
  }

  reparer(): void {
    this.enregistrementEnPanne = false;
    this.suppressionsEnPanne.clear();
  }
}

function cle(magasinId: MagasinId, fichier: FichierImage): string {
  return `${magasinId.valeur}/${fichier.valeur}`;
}
