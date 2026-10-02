import { verifierContratProduitRepository } from '@rdc/referentiel-domain/testing';
import {
  creerPrismaClient,
  PrismaTransaction,
} from '@rdc/shared-kernel-adapters';
import { PrismaProduitRepository } from './prisma-produit.repository';

// Même suite de contrat que le fake en mémoire, sur PostgreSQL (rdc_test).
const prisma = creerPrismaClient(exigerVariable('DATABASE_URL_TEST'));

async function viderLesProduits(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Produit" CASCADE');
}

afterAll(async () => {
  await prisma.$disconnect();
});

verifierContratProduitRepository('PrismaProduitRepository', async () => {
  await viderLesProduits();
  return {
    repository: new PrismaProduitRepository(new PrismaTransaction(prisma)),
    nettoyer: viderLesProduits,
  };
});

function exigerVariable(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) {
    throw new Error(
      `Variable d'environnement ${nom} manquante (voir .env.example)`,
    );
  }
  return valeur;
}
