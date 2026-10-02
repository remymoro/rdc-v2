import {
  type BilanNettoyageImages,
  NettoyerImagesOrphelinesUseCase,
} from '@rdc/referentiel-application';
import { FichierImage, MagasinId } from '@rdc/referentiel-domain';
import { Clock } from '@rdc/shared-kernel-application';
import {
  JournalEnMemoire,
  MagasinRepositoryEnMemoire,
  StockageImagesEnMemoire,
} from '@rdc/referentiel-application/testing';
import {
  INTERVALLE_NETTOYAGE_MS,
  NettoyageImagesOrphelinesTache,
} from './nettoyage-images-orphelines.tache';

const MINUTE = 60 * 1000;
const HEURE = 60 * MINUTE;

/** Journal technique de la tâche, pour vérifier ce qu'elle signale. */
class JournalTache {
  readonly messages: string[] = [];
  readonly erreurs: string[] = [];

  log(message: string): void {
    this.messages.push(message);
  }

  error(message: string): void {
    this.erreurs.push(message);
  }
}

/** Horloge qui suit les minuteries simulées de Jest. */
class HorlogeDesMinuteries extends Clock {
  now(): Date {
    return new Date(jest.now());
  }
}

/** Laisse s'exécuter les promesses lancées par une minuterie. */
async function laisserTourner(): Promise<void> {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

describe('NettoyageImagesOrphelinesTache — au démarrage puis toutes les heures', () => {
  const demarrage = new Date('2026-10-02T08:00:00.000Z');
  const aucunEffet: BilanNettoyageImages = { supprimes: 0, echecs: 0 };

  let journal: JournalTache;
  let tache: NettoyageImagesOrphelinesTache | null;

  beforeEach(() => {
    jest.useFakeTimers({ now: demarrage });
    journal = new JournalTache();
    tache = null;
  });

  afterEach(() => {
    tache?.onApplicationShutdown();
    jest.useRealTimers();
  });

  it('passe une heure par défaut entre deux nettoyages', () => {
    expect(INTERVALLE_NETTOYAGE_MS).toBe(HEURE);
  });

  it('lance un passage au démarrage de l’API, puis un par heure', async () => {
    const lancer = jest.fn(async () => aucunEffet);
    tache = new NettoyageImagesOrphelinesTache(lancer, journal);

    tache.onApplicationBootstrap();
    await laisserTourner();
    expect(lancer).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(HEURE - 1);
    expect(lancer).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(lancer).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(2 * HEURE);
    expect(lancer).toHaveBeenCalledTimes(4);
  });

  it('journalise un passage en échec et continue les suivants', async () => {
    const lancer = jest
      .fn<Promise<BilanNettoyageImages>, []>()
      .mockRejectedValueOnce(new Error('base indisponible'))
      .mockResolvedValue({ supprimes: 2, echecs: 0 });
    tache = new NettoyageImagesOrphelinesTache(lancer, journal);

    tache.onApplicationBootstrap();
    await laisserTourner();
    expect(journal.erreurs).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(HEURE);
    expect(lancer).toHaveBeenCalledTimes(2);
    expect(journal.messages).toEqual([
      expect.stringContaining('2 fichier(s) orphelin(s) supprimé(s)'),
    ]);
  });

  it('ne lance plus rien après l’arrêt de l’API', async () => {
    const lancer = jest.fn(async () => aucunEffet);
    tache = new NettoyageImagesOrphelinesTache(lancer, journal);
    tache.onApplicationBootstrap();
    await laisserTourner();

    tache.onApplicationShutdown();
    await jest.advanceTimersByTimeAsync(3 * HEURE);

    expect(lancer).toHaveBeenCalledTimes(1);
  });

  it('supprime, au passage horaire, un orphelin créé après le démarrage une fois qu’il a dépassé une heure', async () => {
    const horloge = new HorlogeDesMinuteries();
    const stockage = new StockageImagesEnMemoire(horloge);
    const nettoyer = new NettoyerImagesOrphelinesUseCase(
      new MagasinRepositoryEnMemoire(),
      stockage,
      horloge,
      new JournalEnMemoire(),
    );
    const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
    const orpheline = FichierImage.creer(
      '1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e.jpg',
    );
    tache = new NettoyageImagesOrphelinesTache(
      () => nettoyer.execute(),
      journal,
    );
    tache.onApplicationBootstrap();
    await laisserTourner();

    // 10 minutes après le démarrage, un ajout échoue et laisse son fichier.
    await jest.advanceTimersByTimeAsync(10 * MINUTE);
    stockage.deposer(magasinId, orpheline, horloge.now());

    // Passage de 9 h : l'orphelin n'a que 50 minutes, il est gardé.
    await jest.advanceTimersByTimeAsync(50 * MINUTE);
    expect(stockage.noms()).toEqual([
      `${magasinId.valeur}/${orpheline.valeur}`,
    ]);

    // Passage de 10 h : il a dépassé une heure, il est supprimé.
    await jest.advanceTimersByTimeAsync(HEURE);
    expect(stockage.noms()).toEqual([]);
  });
});
