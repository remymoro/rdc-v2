import { Component } from '@angular/core';

/** Le guide d'un profil : ce que la personne a à faire, dans l'ordre. */
interface Guide {
  readonly titre: string;
  readonly etapes: readonly string[];
}

/**
 * Page d'accueil, pensée pour des personnes peu habituées à l'informatique :
 * pour chaque profil, les étapes d'une collecte en phrases simples
 * (RDC-COLLECTE-002, 005, 008, 009, 014, 015, 017, 020 ; RDC-ACCES-009).
 */
@Component({
  selector: 'rdc-accueil',
  templateUrl: './accueil.html',
})
export class Accueil {
  protected readonly guides: readonly Guide[] = [
    {
      titre: 'Vous êtes responsable d’un centre',
      etapes: [
        'Connectez-vous avec l’adresse e-mail et le mot de passe de votre centre, donnés par le siège.',
        'Avant la collecte, appelez les magasins de votre liste et notez pour chacun s’il participe ou non.',
        'Transmettez votre liste au siège, avec votre avis si vous le souhaitez.',
        'Placez vos bénévoles sur des créneaux : en magasin, au centre ou comme chauffeur.',
        'Après la collecte, enregistrez les pesées de chaque magasin. Quand tout est saisi, déclarez votre saisie terminée.',
      ],
    },
    {
      titre: 'Vous êtes l’administrateur du siège',
      etapes: [
        'Créez la collecte : son nom, sa date de début et sa date de fin.',
        'Ouvrez la vérification : chaque centre reçoit la liste des magasins à appeler.',
        'Quand les centres vous ont transmis leur liste, inscrivez les magasins qui participent.',
        'Ouvrez la planification, pour que les centres placent leurs bénévoles.',
        'La collecte démarre toute seule à sa date de début, ou plus tôt si vous la démarrez vous-même.',
        'Quand tous les centres ont terminé leur saisie, approuvez la clôture de la collecte.',
        'Consultez les statistiques : les totaux par centre et par magasin, comparés à ceux de l’an dernier.',
      ],
    },
  ];
}
