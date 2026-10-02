import { LecturesProduits, type VueProduit } from './lectures-produits';

/** Le catalogue des produits (GET /api/produits), en lecture seule. */
export class ListerProduitsQuery {
  constructor(private readonly lecturesProduits: LecturesProduits) {}

  execute(): Promise<readonly VueProduit[]> {
    return this.lecturesProduits.list();
  }
}
