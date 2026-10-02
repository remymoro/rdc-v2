import { verifierContratLecturesProduits } from '@rdc/referentiel-application/testing';
import {
  creerPrismaClient,
  PrismaTransaction,
} from '@rdc/shared-kernel-adapters';
import { PrismaLecturesProduits } from './prisma-lectures-produits';
import { PrismaProduitRepository } from './prisma-produit.repository';

// Même suite de contrat que le fake en mémoire, sur PostgreSQL (rdc_test).
const prisma = creerPrismaClient(exigerVariable('DATABASE_URL_TEST'));

async function viderLesProduits(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Produit" CASCADE');
}

afterAll(async () => {
  await prisma.$disconnect();
});

verifierContratLecturesProduits('PrismaLecturesProduits', async () => {
  await viderLesProduits();
  const produits = new PrismaProduitRepository(new PrismaTransaction(prisma));
  return {
    lectures: new PrismaLecturesProduits(new PrismaTransaction(prisma)),
    enregistrer: async (liste) => {
      for (const produit of liste) {
        await produits.save(produit);
      }
    },
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
