import { Component } from '@angular/core';

/** Le guide d'un profil : ce que la personne a à faire, dans l'ordre. */
interface Guide {
  readonly titre: string;
  readonly etapes: readonly string[];
}

/**
 * Page d'accueil, pensée pour des personnes peu habituées à l'informatique :
 * pour chaque profil, les étapes d'une collecte en phrases simples
 * (RDC-COLLECTE-002, 005, 008, 009, 014, 015, 017, 020, 021 ; RDC-ACCES-009 ;
 * RDC-SAISIE-001).
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
        'Ouvrez la liste des magasins de votre centre. Appelez chaque magasin, puis notez sa réponse dans l’application : « participe » ou « ne participe pas ».',
        'Quand vous avez fini, cliquez sur « Transmettre au siège ». Vous pouvez ajouter un commentaire. Ensuite, vous ne pourrez plus modifier la liste, sauf si le siège vous la renvoie.',
        'Dans l’application, placez vos bénévoles sur des créneaux : en magasin, au centre ou comme chauffeur.',
        'Pendant la collecte, enregistrez dans l’application chaque pesée de vos magasins. Quand toutes vos pesées sont saisies, cliquez sur « Saisie terminée ».',
      ],
    },
    {
      titre: 'Vous êtes l’administrateur du siège',
      etapes: [
        'Dans l’application, créez la collecte : son nom, sa date de début et sa date de fin.',
        'Cliquez sur « Ouvrir la vérification » : chaque centre reçoit la liste des magasins à appeler.',
        'Quand un centre vous a transmis sa liste, relisez-la et inscrivez les magasins qui participent. S’il faut corriger, cliquez sur « Renvoyer au centre » en expliquant pourquoi.',
        'Cliquez sur « Ouvrir la planification », pour que les centres placent leurs bénévoles.',
        'La collecte démarre toute seule à sa date de début, s’il y a au moins un magasin inscrit.',
        'Quand tous les centres ont cliqué sur « Saisie terminée », cliquez sur « Approuver la clôture ».',
        'Consultez les statistiques : les totaux par centre et par magasin, comparés à ceux de l’an dernier.',
      ],
    },
  ];
}
