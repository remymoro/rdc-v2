import { Produit, ProduitId, ProduitRepository } from '@rdc/referentiel-domain';
import { PrismaTransaction } from '@rdc/shared-kernel-adapters';
import { versLigneProduit, versProduit } from './produit.mapper';

/** Adapter secondaire : implémente le port avec Prisma, table v1 `Produit`. */
export class PrismaProduitRepository extends ProduitRepository {
  constructor(private readonly transaction: PrismaTransaction) {
    super();
  }

  async get(id: ProduitId): Promise<Produit | null> {
    const ligne = await this.transaction.client.produit.findUnique({
      where: { id: id.valeur },
    });
    return ligne === null ? null : versProduit(ligne);
  }

  async save(produit: Produit): Promise<void> {
    const ligne = versLigneProduit(produit);
    await this.transaction.client.produit.upsert({
      where: { id: ligne.id },
      create: ligne,
      update: ligne,
    });
  }
}
