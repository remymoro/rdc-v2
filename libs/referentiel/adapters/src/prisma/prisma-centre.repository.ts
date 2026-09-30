import {
  Centre,
  CentreRepository,
  CleDoublonCentre,
} from '@rdc/referentiel-domain';
import { PrismaTransaction } from '@rdc/shared-kernel-adapters';
import { versLigneCentre } from './centre.mapper';

/** Adapter secondaire : implémente le port avec Prisma (TENETS-ADAPTER-004). */
export class PrismaCentreRepository extends CentreRepository {
  constructor(private readonly transaction: PrismaTransaction) {
    super();
  }

  async save(centre: Centre): Promise<void> {
    const ligne = versLigneCentre(centre);
    await this.transaction.client.centre.upsert({
      where: { id: ligne.id },
      create: ligne,
      update: ligne,
    });
  }

  async existsByCleDoublon(cle: CleDoublonCentre): Promise<boolean> {
    const centre = await this.transaction.client.centre.findUnique({
      where: { cleDoublon: cle.valeur },
      select: { id: true },
    });
    return centre !== null;
  }
}
