import {
  CentreId,
  CleDoublonMagasin,
  Magasin,
  MagasinDejaExistant,
  MagasinId,
  MagasinRepository,
} from '@rdc/referentiel-domain';
import {
  estViolationDUnicite,
  PrismaTransaction,
} from '@rdc/shared-kernel-adapters';
import { versLigneMagasin, versMagasin } from './magasin.mapper';

/** Adapter secondaire : implémente le port avec Prisma (TENETS-ADAPTER-004). */
export class PrismaMagasinRepository extends MagasinRepository {
  constructor(private readonly transaction: PrismaTransaction) {
    super();
  }

  async get(id: MagasinId): Promise<Magasin | null> {
    const ligne = await this.transaction.client.magasin.findUnique({
      where: { id: id.valeur },
    });
    return ligne === null ? null : versMagasin(ligne);
  }

  /**
   * Deux créations simultanées passent toutes deux le pré-contrôle du use
   * case : la contrainte unique de la base tranche, et sa violation devient
   * l'échec déclaré par le port (TENETS-ADAPTER-006, ERROR-005).
   */
  async save(magasin: Magasin): Promise<void> {
    const ligne = versLigneMagasin(magasin);
    try {
      await this.transaction.client.magasin.upsert({
        where: { id: ligne.id },
        create: ligne,
        update: ligne,
      });
    } catch (erreur) {
      if (estViolationDUnicite(erreur)) {
        throw new MagasinDejaExistant({ cause: erreur });
      }
      throw erreur;
    }
  }

  async existsByCleDoublon(cle: CleDoublonMagasin): Promise<boolean> {
    const magasin = await this.transaction.client.magasin.findUnique({
      where: { cleDoublon: cle.valeur },
      select: { id: true },
    });
    return magasin !== null;
  }

  async existsNonArchiveDuCentre(centreId: CentreId): Promise<boolean> {
    const magasin = await this.transaction.client.magasin.findFirst({
      where: { centreId: centreId.valeur, statut: { not: 'ARCHIVE' } },
      select: { id: true },
    });
    return magasin !== null;
  }
}
