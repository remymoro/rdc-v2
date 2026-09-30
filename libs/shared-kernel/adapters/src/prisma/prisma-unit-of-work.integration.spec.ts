import { randomUUID } from 'node:crypto';
import { creerPrismaClient } from './prisma-client';
import { PrismaTransaction } from './prisma-transaction';
import { PrismaUnitOfWork } from './prisma-unit-of-work';

// Règles TENETS-UOW vérifiées contre PostgreSQL (base rdc_test).
const prisma = creerPrismaClient(process.env['DATABASE_URL_TEST'] ?? '');

let transaction: PrismaTransaction;
let unitOfWork: PrismaUnitOfWork;

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Centre" CASCADE');
  transaction = new PrismaTransaction(prisma);
  unitOfWork = new PrismaUnitOfWork(prisma, transaction);
});

afterAll(async () => {
  await prisma.$disconnect();
});

/** Écrit une ligne de centre via la ressource transactionnelle partagée. */
async function ecrireUnCentre(nom: string): Promise<string> {
  const id = randomUUID();
  await transaction.client.centre.create({
    data: { id, nom, ville: 'Agen', codePostal: '47000', adresse: '1 rue A' },
  });
  return id;
}

async function existe(id: string): Promise<boolean> {
  return (await prisma.centre.findUnique({ where: { id } })) !== null;
}

describe('PrismaUnitOfWork', () => {
  it('valide le travail quand commit() est appelé (TENETS-UOW-003)', async () => {
    let id = '';
    await unitOfWork.run(async () => {
      id = await ecrireUnCentre('Validé');
      await unitOfWork.commit();
    });

    expect(await existe(id)).toBe(true);
  });

  it('annule le travail terminé sans commit() (TENETS-UOW-003)', async () => {
    let id = '';
    await unitOfWork.run(async () => {
      id = await ecrireUnCentre('Oublié');
    });

    expect(await existe(id)).toBe(false);
  });

  it("annule le travail et relance l'erreur d'origine (TENETS-UOW-010)", async () => {
    const erreurMetier = new Error('règle métier violée');
    let id = '';

    await expect(
      unitOfWork.run(async () => {
        id = await ecrireUnCentre('Interrompu');
        throw erreurMetier;
      }),
    ).rejects.toBe(erreurMetier);
    expect(await existe(id)).toBe(false);
  });

  it('rend les écritures atomiques : tout ou rien (TENETS-UOW-004)', async () => {
    let premier = '';
    await expect(
      unitOfWork.run(async () => {
        premier = await ecrireUnCentre('Premier');
        await ecrireUnCentre('Premier'); // viole @@unique([nom, ville, codePostal, adresse])
        await unitOfWork.commit();
      }),
    ).rejects.toThrow();

    expect(await existe(premier)).toBe(false);
  });

  it('refuse d’être réutilisée pour une seconde transaction (TENETS-UOW-002)', async () => {
    await unitOfWork.run(async () => unitOfWork.commit());

    await expect(unitOfWork.run(async () => undefined)).rejects.toThrow(
      'ne peut pas être réutilisée',
    );
  });

  it('libère la ressource partagée après la transaction (TENETS-UOW-005)', async () => {
    await unitOfWork.run(async () => {
      expect(transaction.client).not.toBe(prisma);
      await unitOfWork.commit();
    });

    expect(transaction.client).toBe(prisma);
  });
});
