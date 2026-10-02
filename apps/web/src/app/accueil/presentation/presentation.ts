import { Component, computed, signal } from '@angular/core';

/** Un message de présentation, affiché seul dans le carrousel. */
interface Diapositive {
  readonly titre: string;
  readonly texte: string;
}

/**
 * Carrousel de présentation de l'accueil : une diapositive à la fois, sans
 * défilement automatique. L'état tient dans un signal (`index`) ; la
 * diapositive affichée en est dérivée (`computed`) et l'affichage suit seul.
 */
@Component({
  selector: 'rdc-presentation',
  templateUrl: './presentation.html',
})
export class Presentation {
  protected readonly diapositives: readonly Diapositive[] = [
    {
      titre: 'Qu’est-ce qu’une collecte ?',
      texte:
        'Une opération de collecte alimentaire, sur une période donnée, dans un ensemble de magasins du Lot-et-Garonne, menée par les centres et leurs bénévoles.',
    },
    {
      titre: 'Préparer',
      texte:
        'Le siège ouvre la vérification : chaque centre contacte ses magasins et transmet sa liste, puis l’administrateur inscrit les magasins qui participent.',
    },
    {
      titre: 'Peser',
      texte:
        'Pendant la fenêtre de saisie, chaque centre enregistre les pesées de ses magasins, puis déclare sa saisie terminée.',
    },
    {
      titre: 'Analyser',
      texte:
        'Les statistiques font la synthèse par centre, magasin, enseigne ou famille, avec la comparaison annuelle.',
    },
  ];

  /** Position de la diapositive affichée (0 = la première). */
  protected readonly index = signal(0);

  protected readonly diapositive = computed(
    () => this.diapositives[this.index()],
  );

  protected suivante(): void {
    this.index.update((i) => (i + 1) % this.diapositives.length);
  }

  protected precedente(): void {
    this.index.update(
      (i) => (i - 1 + this.diapositives.length) % this.diapositives.length,
    );
  }

  protected allerA(position: number): void {
    this.index.set(position);
  }

  protected auClavier(evenement: KeyboardEvent): void {
    if (evenement.key === 'ArrowRight') {
      this.suivante();
    } else if (evenement.key === 'ArrowLeft') {
      this.precedente();
    }
  }
}
