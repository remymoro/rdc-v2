import { verifierContratCentreRepository } from '@rdc/referentiel-domain/testing';
import {
  creerPrismaClient,
  PrismaTransaction,
} from '@rdc/shared-kernel-adapters';
import { PrismaCentreRepository } from './prisma-centre.repository';

// Test d'intégration : la même suite de contrat que le fake en mémoire,
// exécutée contre PostgreSQL (base rdc_test, TENETS-TEST-003, ADR-0003 R10).
const prisma = creerPrismaClient(exigerVariable('DATABASE_URL_TEST'));

async function viderLesCentres(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Centre" CASCADE');
}

afterAll(async () => {
  await prisma.$disconnect();
});

verifierContratCentreRepository('PrismaCentreRepository', async () => {
  await viderLesCentres();
  return {
    repository: new PrismaCentreRepository(new PrismaTransaction(prisma)),
    nettoyer: viderLesCentres,
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
