import { Component } from '@angular/core';

/** Une rubrique de l'application, présentée sur la page d'accueil. */
interface Rubrique {
  readonly titre: string;
  readonly description: string;
}

/**
 * Page d'accueil : présente l'application et ses rubriques, dans l'ordre de
 * construction de la feuille de route. Aucune donnée de l'API pour l'instant.
 */
@Component({
  selector: 'rdc-accueil',
  templateUrl: './accueil.html',
})
export class Accueil {
  protected readonly rubriques: readonly Rubrique[] = [
    {
      titre: 'Référentiel',
      description: 'Les centres, les magasins et le catalogue des produits.',
    },
    {
      titre: 'Collectes',
      description:
        'La préparation et le suivi de chaque collecte, et les magasins inscrits.',
    },
    {
      titre: 'Planification',
      description:
        'Les créneaux des bénévoles en magasin, au centre et pour les chauffeurs.',
    },
    {
      titre: 'Saisie des pesées',
      description: 'Les poids collectés dans chaque magasin, pesée par pesée.',
    },
    {
      titre: 'Statistiques',
      description:
        'Les synthèses par centre, magasin, enseigne ou famille, et la comparaison annuelle.',
    },
  ];
}
