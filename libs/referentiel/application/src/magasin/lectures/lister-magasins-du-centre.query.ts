import type { CentreId } from '@rdc/referentiel-domain';
import { LecturesMagasins, type VueMagasin } from './lectures-magasins';

export interface ListerMagasinsDuCentreRequete {
  readonly centreId: CentreId;
}

/** Les magasins rattachés à un centre (GET /api/centres/:centreId/magasins). */
export class ListerMagasinsDuCentreQuery {
  constructor(private readonly lecturesMagasins: LecturesMagasins) {}

  execute(
    requete: ListerMagasinsDuCentreRequete,
  ): Promise<readonly VueMagasin[]> {
    return this.lecturesMagasins.listByCentre(requete.centreId);
  }
}
