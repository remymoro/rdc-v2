import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  JournalEnMemoire,
  unContenuJpeg,
  unFichier,
} from '@rdc/referentiel-application/testing';
import { MagasinId } from '@rdc/referentiel-domain';
import { DisqueStockageImages } from './disque-stockage-images';

const magasin = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
const fichier = unFichier('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d');

describe('DisqueStockageImages — écriture atomique', () => {
  let racine: string;
  let dossier: string;
  let stockage: DisqueStockageImages;
  let journal: JournalEnMemoire;

  beforeEach(async () => {
    racine = await fs.mkdtemp(join(tmpdir(), 'rdc-images-pannes-'));
    dossier = join(racine, 'magasins', magasin.valeur);
    journal = new JournalEnMemoire();
    stockage = new DisqueStockageImages(racine, journal);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.rm(racine, { recursive: true, force: true });
  });

  it('journalise le temporaire conservé sans masquer la panne initiale (SIMP-3)', async () => {
    const panneEcriture = Object.assign(new Error('disque plein'), {
      code: 'ENOSPC',
    });
    const panneNettoyage = Object.assign(new Error('accès refusé'), {
      code: 'EACCES',
    });
    jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(panneEcriture);
    jest.spyOn(fs, 'rm').mockRejectedValueOnce(panneNettoyage);

    await expect(
      stockage.enregistrer(magasin, fichier, unContenuJpeg()),
    ).rejects.toMatchObject({ cause: panneEcriture });
    expect(journal.avertissements).toEqual([
      expect.objectContaining({
        details: {
          magasinId: magasin.valeur,
          fichier: expect.stringMatching(/\.tmp$/),
        },
        cause: panneNettoyage,
      }),
    ]);
  });

  it('ne rend jamais visible un contenu partiel, et nettoie après ENOSPC', async () => {
    const writeFile = fs.writeFile;
    const panne = Object.assign(new Error('disque plein'), { code: 'ENOSPC' });
    let visiblePendantEcriture = false;
    jest
      .spyOn(fs, 'writeFile')
      .mockImplementationOnce(async (chemin, _contenu, options) => {
        await writeFile(chemin, new Uint8Array([0xff]), options);
        visiblePendantEcriture = (await fs.readdir(dossier)).includes(
          fichier.valeur,
        );
        throw panne;
      });

    await expect(
      stockage.enregistrer(magasin, fichier, unContenuJpeg()),
    ).rejects.toMatchObject({ cause: panne });
    expect(visiblePendantEcriture).toBe(false);
    expect(await fs.readdir(dossier)).toEqual([]);
  });

  it('liste les images sans tenter de supprimer un temporaire ancien inaccessible (IMP-1)', async () => {
    await stockage.enregistrer(magasin, fichier, unContenuJpeg());
    const temporaire = join(
      dossier,
      fichier.valeur + '.11111111-1111-4111-8111-111111111111.tmp',
    );
    await fs.writeFile(temporaire, 'partiel');
    const ancien = new Date('2020-01-01T00:00:00Z');
    await fs.utimes(temporaire, ancien, ancien);
    const supprimer = jest
      .spyOn(fs, 'rm')
      .mockRejectedValueOnce(
        Object.assign(new Error('accès refusé'), { code: 'EACCES' }),
      );

    expect(await stockage.lister()).toHaveLength(1);
    expect(supprimer).not.toHaveBeenCalled();
    await expect(stockage.purgerTemporaires(ancien)).rejects.toMatchObject({
      code: 'STOCKAGE_IMAGES_INDISPONIBLE',
      cause: expect.objectContaining({ code: 'EACCES' }),
    });
    expect(await stockage.lister()).toHaveLength(1);
  });

  it('nettoie seulement ses temporaires anciens, sans toucher les fichiers publiés ou récents', async () => {
    const ancien = fichier.valeur + '.11111111-1111-4111-8111-111111111111.tmp';
    const recent = fichier.valeur + '.22222222-2222-4222-8222-222222222222.tmp';
    await stockage.enregistrer(magasin, fichier, unContenuJpeg());
    for (const nom of [ancien, recent, 'notes.tmp']) {
      await fs.writeFile(join(dossier, nom), 'partiel');
    }
    const dateAncienne = new Date('2020-01-01T00:00:00Z');
    await fs.utimes(join(dossier, ancien), dateAncienne, dateAncienne);
    await fs.utimes(join(dossier, 'notes.tmp'), dateAncienne, dateAncienne);

    await stockage.purgerTemporaires(dateAncienne);
    expect(await stockage.lister()).toHaveLength(1);
    expect((await fs.readdir(dossier)).sort()).toEqual(
      [fichier.valeur, recent, 'notes.tmp'].sort(),
    );
  });

  it.each([
    'ENOENT',
    'ESTALE',
    'ENOTCONN',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENETUNREACH',
    'EHOSTUNREACH',
    'ENODEV',
    'EHOSTDOWN',
    'ENOSYS',
    'EOPNOTSUPP',
    'EXDEV',
  ])(
    'traduit %s à l’écriture en indisponibilité avec sa cause',
    async (code) => {
      const panne = Object.assign(new Error('NAS indisponible'), { code });
      jest.spyOn(fs, 'mkdir').mockRejectedValueOnce(panne);

      await expect(
        stockage.enregistrer(magasin, fichier, unContenuJpeg()),
      ).rejects.toMatchObject({
        code: 'STOCKAGE_IMAGES_INDISPONIBLE',
        cause: panne,
      });
    },
  );

  it.each(['EMFILE', 'ENFILE'])(
    'laisse remonter %s tel quel : un épuisement des descripteurs du processus n’est pas une panne du NAS',
    async (code) => {
      const panne = Object.assign(new Error('trop de fichiers ouverts'), {
        code,
      });
      jest.spyOn(fs, 'mkdir').mockRejectedValueOnce(panne);

      await expect(
        stockage.enregistrer(magasin, fichier, unContenuJpeg()),
      ).rejects.toBe(panne);
    },
  );

  it('retire le temporaire quand la publication échoue autrement que par une collision', async () => {
    const panne = Object.assign(
      new Error('liens physiques non pris en charge'),
      {
        code: 'EOPNOTSUPP',
      },
    );
    jest.spyOn(fs, 'link').mockRejectedValueOnce(panne);

    await expect(
      stockage.enregistrer(magasin, fichier, unContenuJpeg()),
    ).rejects.toMatchObject({
      code: 'STOCKAGE_IMAGES_INDISPONIBLE',
      cause: panne,
    });
    expect(await fs.readdir(dossier)).toEqual([]);
  });

  it('ignore un fichier disparu pendant la liste et conserve les suivants', async () => {
    const autre = unFichier('1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e');
    await stockage.enregistrer(magasin, fichier, unContenuJpeg());
    await stockage.enregistrer(magasin, autre, unContenuJpeg());
    const stat = fs.stat;
    jest
      .spyOn(fs, 'stat')
      .mockImplementation(async (...args: Parameters<typeof fs.stat>) => {
        if (String(args[0]).endsWith(fichier.valeur)) {
          throw Object.assign(new Error('disparu'), { code: 'ENOENT' });
        }
        return stat(...args);
      });

    const liste = await stockage.lister();
    expect(liste.map((f) => f.fichier.valeur)).toEqual([autre.valeur]);
  });

  it('deux écritures concurrentes ne publient qu’un seul contenu complet', async () => {
    const resultats = await Promise.allSettled([
      stockage.enregistrer(magasin, fichier, unContenuJpeg(42)),
      stockage.enregistrer(magasin, fichier, unContenuJpeg(99)),
    ]);
    expect(resultats.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(resultats.find((r) => r.status === 'rejected')).toMatchObject({
      reason: { code: 'IMAGE_FICHIER_DEJA_EXISTANT' },
    });
    const contenu = await fs.readFile(join(dossier, fichier.valeur));
    expect([
      Buffer.from(unContenuJpeg(42).octets),
      Buffer.from(unContenuJpeg(99).octets),
    ]).toContainEqual(contenu);
    expect(await fs.readdir(dossier)).toEqual([fichier.valeur]);
  });
});
