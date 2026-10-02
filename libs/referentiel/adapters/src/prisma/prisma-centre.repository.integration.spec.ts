import {
  Adresse,
  Centre,
  CentreDejaExistant,
  CentreId,
  CodePostal,
  Nom,
  Ville,
} from '@rdc/referentiel-domain';
import { verifierContratCentreRepository } from '@rdc/referentiel-domain/testing';
import {
  creerPrismaClient,
  PrismaTransaction,
  PrismaUnitOfWork,
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

describe('PrismaCentreRepository — créations simultanées (TENETS-ADAPTER-006)', () => {
  beforeEach(viderLesCentres);
  afterAll(viderLesCentres);

  /** Comme en production : une PrismaUnitOfWork par requête. */
  async function enregistrerDansUneTransaction(centre: Centre): Promise<void> {
    const transaction = new PrismaTransaction(prisma);
    const unitOfWork = new PrismaUnitOfWork(prisma, transaction);
    await unitOfWork.run(async () => {
      await new PrismaCentreRepository(transaction).save(centre);
      await unitOfWork.commit();
    });
  }

  function unCentre(id: string, nom: string): Centre {
    return Centre.creer(
      {
        id: CentreId.creer(id),
        nom: Nom.creer(nom),
        adresse: Adresse.creer('12 avenue Jean Jaurès'),
        codePostal: CodePostal.creer('47000'),
        ville: Ville.creer('Agen'),
      },
      new Date('2026-10-01T09:00:00.000Z'),
    );
  }

  it('laisse passer une seule de deux créations de même clé ; l’autre lève CentreDejaExistant', async () => {
    // Deux transactions qui ont chacune passé le pré-contrôle du use case.
    const resultats = await Promise.allSettled([
      enregistrerDansUneTransaction(
        unCentre('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12', "Centre d'Agen"),
      ),
      enregistrerDansUneTransaction(
        unCentre('1c7f4a8b-0d3e-4f2a-9b6c-7d8e9f0a1b2c', "CENTRE-D'AGEN"),
      ),
    ]);

    const echecs = resultats.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    expect(echecs).toHaveLength(1);
    expect(echecs[0]?.reason).toBeInstanceOf(CentreDejaExistant);
    expect((echecs[0]?.reason as Error).cause).toBeDefined();
    expect(await prisma.centre.count()).toBe(1);
  });

  it('traduit aussi la contrainte sur le nom et l’adresse bruts (centres repris de la v1)', async () => {
    // Un centre v1 sans clé de doublon calculée (ADR-0008) : seule la
    // contrainte @@unique([nom, ville, codePostal, adresse]) le protège.
    await prisma.centre.create({
      data: {
        id: '0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b',
        nom: "Centre d'Agen",
        ville: 'Agen',
        codePostal: '47000',
        adresse: '12 avenue Jean Jaurès',
      },
    });

    await expect(
      enregistrerDansUneTransaction(
        unCentre('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12', "Centre d'Agen"),
      ),
    ).rejects.toBeInstanceOf(CentreDejaExistant);
  });
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
