import {
  LecturesProduits,
  type VueProduit,
} from '@rdc/referentiel-application';
import type { PrismaTransaction } from '@rdc/shared-kernel-adapters';

/** Adaptateur de lecture du catalogue : projection directe des lignes. */
export class PrismaLecturesProduits extends LecturesProduits {
  constructor(private readonly transaction: PrismaTransaction) {
    super();
  }

  async list(): Promise<readonly VueProduit[]> {
    const lignes = await this.transaction.client.produit.findMany({
      orderBy: [{ code: 'asc' }, { id: 'asc' }],
    });
    return lignes.map((ligne) => ({
      id: ligne.id,
      code: ligne.code,
      famille: ligne.famille,
      sousFamille: ligne.sousFamille,
      actif: ligne.actif,
      creeLe: ligne.createdAt,
      modifieLe: ligne.updatedAt,
    }));
  }
}
