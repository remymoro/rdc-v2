import type { CentreId } from '@rdc/referentiel-domain';
import { CentreIntrouvable } from '../../errors';
import { LecturesCentres, type VueCentre } from './lectures-centres';

export interface ObtenirCentreRequete {
  readonly centreId: CentreId;
}

/** Le détail d'un centre (GET /api/centres/:id) ; CENTRE_NOT_FOUND sinon. */
export class ObtenirCentreQuery {
  constructor(private readonly lecturesCentres: LecturesCentres) {}

  async execute(requete: ObtenirCentreRequete): Promise<VueCentre> {
    const vue = await this.lecturesCentres.get(requete.centreId);
    if (vue === null) {
      throw new CentreIntrouvable(requete.centreId);
    }
    return vue;
  }
}
