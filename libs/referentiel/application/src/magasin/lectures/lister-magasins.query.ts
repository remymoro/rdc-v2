import { LecturesMagasins, type VueMagasin } from './lectures-magasins';

/**
 * Tous les magasins (GET /api/magasins). Lecture seule, sans unité de
 * travail. Le filtre « son centre » d'un responsable arrive à l'étape 4.
 */
export class ListerMagasinsQuery {
  constructor(private readonly lecturesMagasins: LecturesMagasins) {}

  execute(): Promise<readonly VueMagasin[]> {
    return this.lecturesMagasins.list();
  }
}
