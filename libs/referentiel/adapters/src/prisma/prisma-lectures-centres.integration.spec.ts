import { verifierContratLecturesCentres } from '@rdc/referentiel-application/testing';
import {
  creerPrismaClient,
  PrismaTransaction,
} from '@rdc/shared-kernel-adapters';
import { PrismaCentreRepository } from './prisma-centre.repository';
import { PrismaLecturesCentres } from './prisma-lectures-centres';
import { PrismaMagasinRepository } from './prisma-magasin.repository';

// Même suite de contrat que le fake en mémoire, sur PostgreSQL (rdc_test).
const prisma = creerPrismaClient(exigerVariable('DATABASE_URL_TEST'));

async function viderLaBase(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Magasin", "Centre" CASCADE');
}

afterAll(async () => {
  await prisma.$disconnect();
});

verifierContratLecturesCentres('PrismaLecturesCentres', async () => {
  await viderLaBase();
  const transaction = new PrismaTransaction(prisma);
  const centres = new PrismaCentreRepository(transaction);
  const magasins = new PrismaMagasinRepository(transaction);
  return {
    lectures: new PrismaLecturesCentres(transaction),
    enregistrer: async (listeCentres, listeMagasins = []) => {
      for (const centre of listeCentres) {
        await centres.save(centre);
      }
      for (const magasin of listeMagasins) {
        await magasins.save(magasin);
      }
    },
    nettoyer: viderLaBase,
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
