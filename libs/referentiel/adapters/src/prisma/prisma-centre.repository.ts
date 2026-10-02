import {
  Centre,
  CentreDejaExistant,
  CentreId,
  CentreRepository,
  CleDoublonCentre,
} from '@rdc/referentiel-domain';
import {
  estViolationDUnicite,
  PrismaTransaction,
} from '@rdc/shared-kernel-adapters';
import { versCentre, versLigneCentre } from './centre.mapper';

/** Adapter secondaire : implémente le port avec Prisma (TENETS-ADAPTER-004). */
export class PrismaCentreRepository extends CentreRepository {
  constructor(private readonly transaction: PrismaTransaction) {
    super();
  }

  async get(id: CentreId): Promise<Centre | null> {
    const ligne = await this.transaction.client.centre.findUnique({
      where: { id: id.valeur },
    });
    return ligne === null ? null : versCentre(ligne);
  }

  /**
   * Deux créations simultanées passent toutes deux le pré-contrôle du use
   * case : une contrainte unique de la base tranche (clé de doublon, ou
   * nom + adresse bruts), et sa violation devient l'échec déclaré par le port
   * (TENETS-ADAPTER-006, ERROR-005).
   */
  async save(centre: Centre): Promise<void> {
    const ligne = versLigneCentre(centre);
    try {
      await this.transaction.client.centre.upsert({
        where: { id: ligne.id },
        create: ligne,
        update: ligne,
      });
    } catch (erreur) {
      if (estViolationDUnicite(erreur)) {
        throw new CentreDejaExistant({ cause: erreur });
      }
      throw erreur;
    }
  }

  async existsByCleDoublon(cle: CleDoublonCentre): Promise<boolean> {
    const centre = await this.transaction.client.centre.findUnique({
      where: { cleDoublon: cle.valeur },
      select: { id: true },
    });
    return centre !== null;
  }
}
