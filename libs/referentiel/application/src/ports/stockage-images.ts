import type {
  ContenuImage,
  FichierImage,
  MagasinId,
} from '@rdc/referentiel-domain';

/**
 * Le stockage des images ne répond pas (disque plein, droits, NAS absent…).
 * Échec attendu déclaré par le port (TENETS-ERROR-004).
 */
export class StockageImagesIndisponible extends Error {
  readonly code = 'STOCKAGE_IMAGES_INDISPONIBLE';

  constructor(options?: { readonly cause?: unknown }) {
    super(
      'Le stockage des images est indisponible : réessayez plus tard.',
      options,
    );
    this.name = 'StockageImagesIndisponible';
  }
}

export class FichierImageDejaExistant extends Error {
  readonly code = 'IMAGE_FICHIER_DEJA_EXISTANT';

  constructor(options?: { readonly cause?: unknown }) {
    super('Le fichier de cette image existe déjà.', options);
    this.name = 'FichierImageDejaExistant';
  }
}

/** Un fichier d'image présent dans le stockage, vu par le nettoyage. */
export interface FichierImageStocke {
  readonly magasinId: MagasinId;
  readonly fichier: FichierImage;
  /** Dernière écriture du fichier : sert à épargner un ajout en cours. */
  readonly modifieLe: Date;
}

/**
 * Fichiers des images des magasins (RDC-REF-007), rangés par magasin
 * (TENETS-PORT-002 : capacité de l'application). La base fait foi : un
 * fichier sans image en base est un orphelin, supprimé par le nettoyage.
 */
export abstract class StockageImages {
  /**
   * Écrit le fichier d'une nouvelle image dans le dossier de son magasin.
   * Ne remplace jamais un fichier existant, même avec un contenu identique.
   * @throws FichierImageDejaExistant
   * @throws StockageImagesIndisponible
   */
  abstract enregistrer(
    magasinId: MagasinId,
    fichier: FichierImage,
    contenu: ContenuImage,
  ): Promise<void>;

  /**
   * Supprime le fichier d'une image ; sans effet s'il n'existe déjà plus.
   * @throws StockageImagesIndisponible
   */
  abstract supprimer(
    magasinId: MagasinId,
    fichier: FichierImage,
  ): Promise<void>;

  /**
   * Lecture seule : tous les fichiers d'images présents. Ce qui n'a pas la forme d'un fichier
   * d'image (autre nom, autre dossier) est ignoré, donc jamais supprimé.
   * @throws StockageImagesIndisponible
   */
  abstract lister(): Promise<readonly FichierImageStocke[]>;

  /**
   * Supprime les seuls temporaires privés de l'adapter dont la dernière
   * écriture est antérieure ou égale à la limite. Épargne les images publiées.
   * Sans effet pour un stockage qui ne produit pas de temporaires.
   * Un temporaire qui résiste n'empêche pas la purge des autres ; l'échec est
   * signalé à la fin et un prochain passage réessaie.
   * @throws StockageImagesIndisponible
   */
  abstract purgerTemporaires(avant: Date): Promise<void>;
}
