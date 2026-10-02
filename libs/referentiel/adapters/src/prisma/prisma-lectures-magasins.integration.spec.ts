import {
  Adresse,
  Centre,
  CentreId,
  CodePostal,
  Nom,
  Ville,
} from '@rdc/referentiel-domain';
import { verifierContratLecturesMagasins } from '@rdc/referentiel-application/testing';
import {
  creerPrismaClient,
  PrismaTransaction,
} from '@rdc/shared-kernel-adapters';
import { PrismaCentreRepository } from './prisma-centre.repository';
import { PrismaLecturesMagasins } from './prisma-lectures-magasins';
import { PrismaMagasinRepository } from './prisma-magasin.repository';

// Même suite de contrat que le fake en mémoire, sur PostgreSQL (rdc_test).
const prisma = creerPrismaClient(exigerVariable('DATABASE_URL_TEST'));
const centres = [
  CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12'),
  CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b'),
] as const;

async function viderLaBase(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Magasin", "Centre" CASCADE');
}

async function enregistrerLesCentres(): Promise<void> {
  const repository = new PrismaCentreRepository(new PrismaTransaction(prisma));
  for (const [index, id] of centres.entries()) {
    await repository.save(
      Centre.creer(
        {
          id,
          nom: Nom.creer(`Centre ${index}`),
          adresse: Adresse.creer(`${index + 1} avenue Jean Jaurès`),
          codePostal: CodePostal.creer('47000'),
          ville: Ville.creer('Agen'),
        },
        new Date('2026-10-01T08:00:00.000Z'),
      ),
    );
  }
}

afterAll(async () => {
  await prisma.$disconnect();
});

verifierContratLecturesMagasins('PrismaLecturesMagasins', async () => {
  await viderLaBase();
  await enregistrerLesCentres();
  const magasins = new PrismaMagasinRepository(new PrismaTransaction(prisma));
  return {
    lectures: new PrismaLecturesMagasins(new PrismaTransaction(prisma)),
    centres,
    enregistrer: async (liste) => {
      for (const magasin of liste) {
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
