import type { StatutCentre } from '@rdc/referentiel-domain';
import {
  type FiltreCentres,
  LecturesCentres,
  type VueCentre,
} from './lectures-centres';

export interface ListerCentresRequete {
  readonly statut?: StatutCentre;
  /** Texte libre ; vide ou blanc = pas de recherche. */
  readonly recherche?: string;
}

/**
 * Les centres (GET /api/centres), filtrés par statut et par recherche dans le
 * nom ou la ville. Lecture seule, sans unité de travail.
 */
export class ListerCentresQuery {
  constructor(private readonly lecturesCentres: LecturesCentres) {}

  execute(requete: ListerCentresRequete): Promise<readonly VueCentre[]> {
    const recherche = requete.recherche?.trim();
    const filtre: FiltreCentres = {
      ...(requete.statut && { statut: requete.statut }),
      ...(recherche && { recherche }),
    };
    return this.lecturesCentres.list(filtre);
  }
}
