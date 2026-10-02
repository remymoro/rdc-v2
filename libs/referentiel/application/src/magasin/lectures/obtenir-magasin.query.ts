import type { MagasinId } from '@rdc/referentiel-domain';
import { MagasinIntrouvable } from '../../errors';
import { LecturesMagasins, type VueMagasin } from './lectures-magasins';

export interface ObtenirMagasinRequete {
  readonly magasinId: MagasinId;
}

/** Le détail d'un magasin (GET /api/magasins/:id) ; MAGASIN_NOT_FOUND sinon. */
export class ObtenirMagasinQuery {
  constructor(private readonly lecturesMagasins: LecturesMagasins) {}

  async execute(requete: ObtenirMagasinRequete): Promise<VueMagasin> {
    const vue = await this.lecturesMagasins.get(requete.magasinId);
    if (vue === null) {
      throw new MagasinIntrouvable(requete.magasinId);
    }
    return vue;
  }
}
