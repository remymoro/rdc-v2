import type {
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import type { BilanNettoyageImages } from '@rdc/referentiel-application';

/** Une heure entre deux passages : le NAS est éteint hors saison. */
export const INTERVALLE_NETTOYAGE_MS = 60 * 60 * 1000;

/** Lance un passage avec un use case neuf (son propre contexte). */
export type LancerNettoyageImages = () => Promise<BilanNettoyageImages>;

/** Ce que la tâche écrit dans les journaux de l'API. */
export interface JournalTache {
  log(message: string): void;
  error(message: string, trace?: string): void;
}

/**
 * Adapter primaire (TENETS-PATTERN-005) : lance le nettoyage des images
 * orphelines au démarrage de l'API, puis toutes les heures. Un passage en
 * échec est journalisé ; le suivant a lieu normalement. Deux passages ne se
 * chevauchent jamais.
 */
export class NettoyageImagesOrphelinesTache
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private minuterie: ReturnType<typeof setInterval> | null = null;
  private enCours = false;

  constructor(
    private readonly lancer: LancerNettoyageImages,
    private readonly journal: JournalTache,
  ) {}

  onApplicationBootstrap(): void {
    void this.executer();
    this.minuterie = setInterval(
      () => void this.executer(),
      INTERVALLE_NETTOYAGE_MS,
    );
    // La minuterie ne retient pas le processus à l'arrêt.
    this.minuterie.unref();
  }

  onApplicationShutdown(): void {
    if (this.minuterie !== null) {
      clearInterval(this.minuterie);
      this.minuterie = null;
    }
  }

  private async executer(): Promise<void> {
    if (this.enCours) {
      return;
    }
    this.enCours = true;
    try {
      const bilan = await this.lancer();
      if (bilan.supprimes > 0 || bilan.echecs > 0) {
        this.journal.log(
          `Nettoyage des images : ${bilan.supprimes} fichier(s) orphelin(s) supprimé(s), ${bilan.echecs} échec(s).`,
        );
      }
    } catch (erreur) {
      // Frontière externe de la tâche (TENETS-ERROR-007) : journalisé une fois.
      this.journal.error(
        'Nettoyage des images orphelines en échec : nouvel essai dans une heure.',
        erreur instanceof Error ? erreur.stack : String(erreur),
      );
    } finally {
      this.enCours = false;
    }
  }
}
