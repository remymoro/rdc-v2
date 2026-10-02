import {
  FichierImage,
  ImageMagasin,
  ImageMagasinId,
  Magasin,
  MagasinId,
  StatutMagasin,
} from '@rdc/referentiel-domain';
import { StockageImagesIndisponible } from '../ports/stockage-images';
import { HorlogeReglable } from '../testing/horloge-reglable.test-utils';
import { JournalEnMemoire } from '../testing/journal-en-memoire.test-utils';
import { unMagasinExistant } from '../testing/magasin-existant.test-utils';
import { MagasinRepositoryEnMemoire } from '../testing/magasin-repository-en-memoire.test-utils';
import { StockageImagesEnMemoire } from '../testing/stockage-images-en-memoire.test-utils';
import { NettoyerImagesOrphelinesUseCase } from './nettoyer-images-orphelines.use-case';

const MINUTE = 60 * 1000;
const HEURE = 60 * MINUTE;

describe('NettoyerImagesOrphelinesUseCase (RDC-REF-007)', () => {
  const demarrage = new Date('2026-10-02T08:00:00.000Z');
  const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
  const magasinInconnu = MagasinId.creer(
    '5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c',
  );
  const referencee = fichier('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d');
  const orpheline = fichier('1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e');

  let horloge: HorlogeReglable;
  let stockage: StockageImagesEnMemoire;
  let journal: JournalEnMemoire;
  let nettoyer: NettoyerImagesOrphelinesUseCase;

  function fichier(id: string): FichierImage {
    return FichierImage.creer(`${id}.jpg`);
  }

  /** Le magasin en base, qui référence `referencee`. */
  function unMagasinAvecImage(): Magasin {
    const existant = unMagasinExistant(magasinId, StatutMagasin.ACTIF);
    return Magasin.reconstituer({
      id: existant.id,
      nom: existant.nom,
      adresse: existant.adresse,
      codePostal: existant.codePostal,
      ville: existant.ville,
      centreId: existant.centreId,
      statut: existant.statut,
      images: [
        ImageMagasin.reconstituer({
          id: ImageMagasinId.creer('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d'),
          fichier: referencee,
          ordre: 0,
          ajouteeLe: demarrage,
        }),
      ],
      creeLe: existant.creeLe,
      modifieLe: existant.modifieLe,
    });
  }

  function ilYA(duree: number): Date {
    return new Date(horloge.now().getTime() - duree);
  }

  function nom(cible: MagasinId, fichierStocke: FichierImage): string {
    return `${cible.valeur}/${fichierStocke.valeur}`;
  }

  beforeEach(() => {
    horloge = new HorlogeReglable(demarrage);
    stockage = new StockageImagesEnMemoire(horloge);
    journal = new JournalEnMemoire();
    nettoyer = new NettoyerImagesOrphelinesUseCase(
      new MagasinRepositoryEnMemoire([unMagasinAvecImage()]),
      stockage,
      horloge,
      journal,
    );
  });

  it('supprime un orphelin de plus d’une heure', async () => {
    stockage.deposer(magasinId, orpheline, ilYA(2 * HEURE));

    const bilan = await nettoyer.execute();

    expect(stockage.noms()).toEqual([]);
    expect(bilan).toEqual({ supprimes: 1, echecs: 0 });
  });

  it('supprime un orphelin d’une heure tout juste', async () => {
    stockage.deposer(magasinId, orpheline, ilYA(HEURE));

    await nettoyer.execute();

    expect(stockage.noms()).toEqual([]);
  });

  it('garde un orphelin de moins d’une heure : un ajout est peut-être en cours', async () => {
    stockage.deposer(magasinId, orpheline, ilYA(59 * MINUTE));

    const bilan = await nettoyer.execute();

    expect(stockage.noms()).toEqual([nom(magasinId, orpheline)]);
    expect(bilan).toEqual({ supprimes: 0, echecs: 0 });
  });

  it('garde un fichier référencé en base, même ancien', async () => {
    stockage.deposer(magasinId, referencee, ilYA(30 * 24 * HEURE));

    await nettoyer.execute();

    expect(stockage.noms()).toEqual([nom(magasinId, referencee)]);
  });

  it('garde et signale les fichiers d’un magasin inconnu en base : base et dossier ne correspondent pas', async () => {
    // Un magasin n'est jamais supprimé : son absence signale une base vide,
    // en cours de reprise ou une autre base que celle du dossier (revue B1).
    stockage.deposer(magasinInconnu, referencee, ilYA(2 * HEURE));
    stockage.deposer(magasinInconnu, orpheline, ilYA(2 * HEURE));

    const bilan = await nettoyer.execute();

    expect(stockage.noms()).toEqual([
      nom(magasinInconnu, referencee),
      nom(magasinInconnu, orpheline),
    ]);
    expect(bilan).toEqual({ supprimes: 0, echecs: 0 });
    expect(journal.avertissements).toEqual([
      expect.objectContaining({
        details: { magasinId: magasinInconnu.valeur },
      }),
    ]);
  });

  it('est idempotent : relancé, il ne fait plus rien', async () => {
    stockage.deposer(magasinId, referencee, ilYA(2 * HEURE));
    stockage.deposer(magasinId, orpheline, ilYA(2 * HEURE));

    const premier = await nettoyer.execute();
    const second = await nettoyer.execute();

    expect(premier).toEqual({ supprimes: 1, echecs: 0 });
    expect(second).toEqual({ supprimes: 0, echecs: 0 });
    expect(stockage.noms()).toEqual([nom(magasinId, referencee)]);
  });

  it('journalise un échec de suppression et réessaie à l’exécution suivante', async () => {
    stockage.deposer(magasinId, orpheline, ilYA(2 * HEURE));
    stockage.tomberEnPanneALaSuppression(orpheline);

    const enEchec = await nettoyer.execute();

    expect(enEchec).toEqual({ supprimes: 0, echecs: 1 });
    expect(stockage.noms()).toEqual([nom(magasinId, orpheline)]);
    expect(journal.avertissements).toEqual([
      expect.objectContaining({
        details: { magasinId: magasinId.valeur, fichier: orpheline.valeur },
        cause: expect.any(StockageImagesIndisponible),
      }),
    ]);

    stockage.reparer();
    const reprise = await nettoyer.execute();

    expect(reprise).toEqual({ supprimes: 1, echecs: 0 });
    expect(stockage.noms()).toEqual([]);
  });

  it('un échec n’empêche pas de supprimer les autres orphelins', async () => {
    const autreOrpheline = fichier('2f6a4dae-8c3b-4e5a-9d9f-7b4cae3e6d8f');
    stockage.deposer(magasinId, orpheline, ilYA(2 * HEURE));
    stockage.deposer(magasinId, autreOrpheline, ilYA(2 * HEURE));
    stockage.tomberEnPanneALaSuppression(orpheline);

    const bilan = await nettoyer.execute();

    expect(bilan).toEqual({ supprimes: 1, echecs: 1 });
    expect(stockage.noms()).toEqual([nom(magasinId, orpheline)]);
  });
});
