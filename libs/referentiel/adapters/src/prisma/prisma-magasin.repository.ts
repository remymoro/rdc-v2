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
import {
  versLigneMagasin,
  versLignesImagesMagasin,
  versMagasin,
} from './magasin.mapper';

/** Adapter secondaire : implémente le port avec Prisma (TENETS-ADAPTER-004). */
export class PrismaMagasinRepository extends MagasinRepository {
  constructor(private readonly transaction: PrismaTransaction) {
    super();
  }

  /**
   * Dans une unité de travail, verrouille la ligne du magasin jusqu'à la
   * validation : une seconde écriture sur le même magasin lit l'état validé
   * par la première, au lieu d'effacer ses images en enregistrant un
   * instantané périmé (save() efface les images que l'agrégat n'a plus).
   * Hors transaction, le verrou est sans effet (revue du lot C, B2).
   */
  async get(id: MagasinId): Promise<Magasin | null> {
    await this.transaction.client
      .$queryRaw`SELECT 1 FROM "Magasin" WHERE "id" = ${id.valeur} FOR UPDATE`;
    const ligne = await this.transaction.client.magasin.findUnique({
      where: { id: id.valeur },
      include: { images: true },
    });
    return ligne === null ? null : versMagasin(ligne);
  }

  /**
   * Deux créations simultanées passent toutes deux le pré-contrôle du use
   * case : la contrainte unique de la base tranche, et sa violation devient
   * l'échec déclaré par le port (TENETS-ADAPTER-006, ERROR-005).
   * Les images suivent l'agrégat (TENETS-AGGREGATE-004) : celles qu'il n'a
   * plus sont effacées, les nouvelles ajoutées ; une image ne change jamais.
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

    const images = versLignesImagesMagasin(magasin);
    await this.transaction.client.magasinImage.deleteMany({
      where: {
        magasinId: ligne.id,
        id: { notIn: images.map((image) => image.id as string) },
      },
    });
    await this.transaction.client.magasinImage.createMany({
      data: images,
      skipDuplicates: true,
    });
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
