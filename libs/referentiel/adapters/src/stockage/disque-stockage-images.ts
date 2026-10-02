import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import {
  type FichierImageStocke,
  StockageImages,
  StockageImagesIndisponible,
} from '@rdc/referentiel-application';
import {
  ContenuImage,
  FichierImage,
  FichierImageInvalide,
  MagasinId,
  MagasinIdInvalide,
  MagasinIdVide,
} from '@rdc/referentiel-domain';

/**
 * Un chemin calculé sortirait du dossier du magasin. Ne peut arriver qu'après
 * un contournement de FichierImage : c'est un bug, jamais une erreur de saisie.
 */
export class CheminImageHorsDossier extends Error {
  readonly code = 'CHEMIN_IMAGE_HORS_DOSSIER';

  constructor() {
    super("Le fichier d'image sortirait du dossier de son magasin.");
    this.name = 'CheminImageHorsDossier';
  }
}

/**
 * Chemin de `nom` dans `dossier`, refusé s'il en sort ou s'il désigne le
 * dossier lui-même (défense en profondeur, audit A-18).
 */
export function cheminDansLeDossier(dossier: string, nom: string): string {
  const base = resolve(dossier);
  const chemin = resolve(base, nom);
  if (!chemin.startsWith(`${base}${sep}`)) {
    throw new CheminImageHorsDossier();
  }
  return chemin;
}

/** Échecs du système de fichiers qui signifient « stockage indisponible ». */
const CODES_INDISPONIBLE = new Set([
  'EACCES',
  'EPERM',
  'EROFS',
  'ENOSPC',
  'EDQUOT',
  'EIO',
  'EBUSY',
  'ENOTDIR',
  'ETIMEDOUT',
]);

/**
 * Adapter du port StockageImages sur un dossier du disque (TENETS-ADAPTER-004) :
 * le dossier partagé du NAS, servi tel quel par nginx sous `/uploads`.
 * Arborescence reprise de la v1 : `<racine>/magasins/<magasinId>/<fichier>`.
 */
export class DisqueStockageImages extends StockageImages {
  readonly racine: string;

  constructor(racine: string) {
    super();
    this.racine = resolve(racine);
  }

  async enregistrer(
    magasinId: MagasinId,
    fichier: FichierImage,
    contenu: ContenuImage,
  ): Promise<void> {
    const dossier = this.dossierDuMagasin(magasinId);
    const chemin = cheminDansLeDossier(dossier, fichier.valeur);
    await traduireLesPannes(async () => {
      await mkdir(dossier, { recursive: true });
      // « wx » : un fichier existant n'est jamais écrasé.
      await writeFile(chemin, contenu.octets, { flag: 'wx' });
    });
  }

  async supprimer(magasinId: MagasinId, fichier: FichierImage): Promise<void> {
    const chemin = cheminDansLeDossier(
      this.dossierDuMagasin(magasinId),
      fichier.valeur,
    );
    await traduireLesPannes(() => rm(chemin, { force: true }));
  }

  async lister(): Promise<readonly FichierImageStocke[]> {
    return traduireLesPannes(async () => {
      const stockes: FichierImageStocke[] = [];
      for (const entree of await lireDossier(this.dossierDesMagasins())) {
        const magasinId = entree.isDirectory()
          ? magasinIdDepuisNom(entree.name)
          : null;
        if (magasinId === null) {
          continue;
        }
        const dossier = this.dossierDuMagasin(magasinId);
        for (const element of await lireDossier(dossier)) {
          const fichier = element.isFile()
            ? fichierDepuisNom(element.name)
            : null;
          if (fichier !== null) {
            const { mtimeMs } = await stat(
              cheminDansLeDossier(dossier, fichier.valeur),
            );
            stockes.push({ magasinId, fichier, modifieLe: new Date(mtimeMs) });
          }
        }
      }
      return stockes;
    });
  }

  private dossierDesMagasins(): string {
    return join(this.racine, 'magasins');
  }

  private dossierDuMagasin(magasinId: MagasinId): string {
    return cheminDansLeDossier(this.dossierDesMagasins(), magasinId.valeur);
  }
}

async function traduireLesPannes<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (erreur) {
    if (CODES_INDISPONIBLE.has(codeSysteme(erreur) ?? '')) {
      throw new StockageImagesIndisponible({ cause: erreur });
    }
    throw erreur;
  }
}

/** Contenu d'un dossier ; un dossier absent est vide. */
async function lireDossier(dossier: string) {
  try {
    return await readdir(dossier, { withFileTypes: true });
  } catch (erreur) {
    if (codeSysteme(erreur) === 'ENOENT') {
      return [];
    }
    throw erreur;
  }
}

/** Code d'une erreur système de Node (`ENOENT`…), sinon undefined. */
function codeSysteme(erreur: unknown): string | undefined {
  return typeof erreur === 'object' && erreur !== null && 'code' in erreur
    ? String(erreur.code)
    : undefined;
}

/** Le nom d'un dossier de magasin, s'il est exactement un MagasinId. */
function magasinIdDepuisNom(nom: string): MagasinId | null {
  try {
    const magasinId = MagasinId.creer(nom);
    return magasinId.valeur === nom ? magasinId : null;
  } catch (erreur) {
    if (
      erreur instanceof MagasinIdInvalide ||
      erreur instanceof MagasinIdVide
    ) {
      return null;
    }
    throw erreur;
  }
}

/** Le nom d'un fichier, s'il a la forme d'un fichier d'image. */
function fichierDepuisNom(nom: string): FichierImage | null {
  try {
    return FichierImage.creer(nom);
  } catch (erreur) {
    if (erreur instanceof FichierImageInvalide) {
      return null;
    }
    throw erreur;
  }
}
