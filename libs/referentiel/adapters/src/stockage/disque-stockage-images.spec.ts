import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, sep } from 'node:path';
import { StockageImagesIndisponible } from '@rdc/referentiel-application';
import {
  unContenuJpeg,
  unFichier,
  verifierContratStockageImages,
} from '@rdc/referentiel-application/testing';
import { MagasinId } from '@rdc/referentiel-domain';
import {
  CheminImageHorsDossier,
  cheminDansLeDossier,
  DisqueStockageImages,
} from './disque-stockage-images';

// Test de l'adapter sur un vrai système de fichiers (dossier temporaire) :
// il ne demande pas PostgreSQL et tourne avec les tests unitaires.
async function unDossierTemporaire(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'rdc-images-'));
}

const MAGASIN = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
const ID_IMAGE = '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d';

verifierContratStockageImages('DisqueStockageImages', async () => {
  const racine = await unDossierTemporaire();
  return {
    stockage: new DisqueStockageImages(racine),
    lireFichier: async (magasinId, fichier) => {
      try {
        return new Uint8Array(
          await readFile(
            join(racine, 'magasins', magasinId.valeur, fichier.valeur),
          ),
        );
      } catch {
        return null;
      }
    },
    nettoyer: () => rm(racine, { recursive: true, force: true }),
  };
});

describe('DisqueStockageImages — emplacement des fichiers (audit A-18)', () => {
  let racine: string;

  beforeEach(async () => {
    racine = await unDossierTemporaire();
  });

  afterEach(async () => {
    await rm(racine, { recursive: true, force: true });
  });

  it('range le fichier sous <racine>/magasins/<magasin>/<uuid>.<extension>', async () => {
    await new DisqueStockageImages(racine).enregistrer(
      MAGASIN,
      unFichier(ID_IMAGE),
      unContenuJpeg(),
    );

    expect(await readdir(join(racine, 'magasins', MAGASIN.valeur))).toEqual([
      `${ID_IMAGE}.jpg`,
    ]);
  });

  it('accepte une racine relative, résolue depuis le dossier courant', () => {
    const stockage = new DisqueStockageImages('uploads');

    expect(stockage.racine).toBe(join(process.cwd(), 'uploads'));
  });

  it('garde x./../evil dans le dossier du magasin (audit A-18)', () => {
    const dossier = join(racine, 'magasins', MAGASIN.valeur);

    const chemin = cheminDansLeDossier(dossier, 'x./../evil');

    expect(chemin.startsWith(`${dossier}${sep}`)).toBe(true);
    expect(dirname(chemin)).toBe(dossier);
  });

  it.each(['../evil', '../../etc/passwd', '/etc/passwd', '..', '.', ''])(
    'refuse un nom qui sortirait du dossier du magasin (%j)',
    (nom) => {
      const dossier = join(racine, 'magasins', MAGASIN.valeur);

      expect(() => cheminDansLeDossier(dossier, nom)).toThrow(
        CheminImageHorsDossier,
      );
    },
  );

  it('garde dans le dossier un nom sans séparateur', () => {
    const dossier = join(racine, 'magasins', MAGASIN.valeur);

    expect(cheminDansLeDossier(dossier, `${ID_IMAGE}.jpg`)).toBe(
      join(dossier, `${ID_IMAGE}.jpg`),
    );
  });

  it('ignore à la lecture ce qui n’est pas un fichier d’image', async () => {
    const dossierMagasin = join(racine, 'magasins', MAGASIN.valeur);
    await mkdir(join(dossierMagasin, 'sous-dossier'), { recursive: true });
    await writeFile(join(dossierMagasin, 'lisezmoi.txt'), 'notes');
    await mkdir(join(racine, 'magasins', 'pas-un-magasin'), {
      recursive: true,
    });
    await writeFile(
      join(racine, 'magasins', 'pas-un-magasin', `${ID_IMAGE}.jpg`),
      'x',
    );
    await writeFile(join(racine, 'magasins', 'fichier-a-la-racine.jpg'), 'x');

    expect(await new DisqueStockageImages(racine).lister()).toEqual([]);
  });

  it('traduit un dossier inutilisable en StockageImagesIndisponible, avec la cause', async () => {
    // La racine est un fichier : le dossier du magasin ne peut pas être créé.
    const racineFichier = join(racine, 'pas-un-dossier');
    await writeFile(racineFichier, 'x');

    const erreur = await new DisqueStockageImages(racineFichier)
      .enregistrer(MAGASIN, unFichier(ID_IMAGE), unContenuJpeg())
      .catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(StockageImagesIndisponible);
    expect((erreur as Error).cause).toMatchObject({ code: 'ENOTDIR' });
  });
});
