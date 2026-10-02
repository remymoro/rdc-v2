import {
  Adresse,
  Centre,
  CentreId,
  CodePostal,
  FichierImage,
  ImageMagasinId,
  Magasin,
  MagasinDejaExistant,
  MagasinId,
  Nom,
  Ville,
} from '@rdc/referentiel-domain';
import { verifierContratMagasinRepository } from '@rdc/referentiel-domain/testing';
import {
  creerPrismaClient,
  PrismaTransaction,
  PrismaUnitOfWork,
} from '@rdc/shared-kernel-adapters';
import { PrismaCentreRepository } from './prisma-centre.repository';
import { PrismaMagasinRepository } from './prisma-magasin.repository';

// Test d'intégration : la même suite de contrat que le fake en mémoire,
// exécutée contre PostgreSQL (base rdc_test, TENETS-TEST-003, ADR-0003 R10).
const prisma = creerPrismaClient(exigerVariable('DATABASE_URL_TEST'));
const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');
const autreCentreId = CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b');

async function viderLaBase(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Magasin", "Centre" CASCADE');
}

/** Le magasin référence son centre : clé étrangère en base. */
async function enregistrerLeCentre(
  id: CentreId = centreId,
  nom = "Centre d'Agen",
): Promise<void> {
  await new PrismaCentreRepository(new PrismaTransaction(prisma)).save(
    Centre.creer(
      {
        id,
        nom: Nom.creer(nom),
        adresse: Adresse.creer('12 avenue Jean Jaurès'),
        codePostal: CodePostal.creer('47000'),
        ville: Ville.creer('Agen'),
      },
      new Date('2026-10-01T08:00:00.000Z'),
    ),
  );
}

afterAll(async () => {
  await prisma.$disconnect();
});

verifierContratMagasinRepository('PrismaMagasinRepository', async () => {
  await viderLaBase();
  await enregistrerLeCentre();
  await enregistrerLeCentre(autreCentreId, 'Centre de Villeneuve');
  return {
    repository: new PrismaMagasinRepository(new PrismaTransaction(prisma)),
    centreId,
    autreCentreId,
    nettoyer: viderLaBase,
  };
});

describe('PrismaMagasinRepository — créations simultanées (TENETS-ADAPTER-006)', () => {
  beforeEach(async () => {
    await viderLaBase();
    await enregistrerLeCentre();
  });

  afterAll(viderLaBase);

  /** Comme en production : une PrismaUnitOfWork par requête. */
  async function enregistrerDansUneTransaction(
    magasin: Magasin,
  ): Promise<void> {
    const transaction = new PrismaTransaction(prisma);
    const unitOfWork = new PrismaUnitOfWork(prisma, transaction);
    await unitOfWork.run(async () => {
      await new PrismaMagasinRepository(transaction).save(magasin);
      await unitOfWork.commit();
    });
  }

  function unMagasin(id: string, nom: string): Magasin {
    return Magasin.creer(
      {
        id: MagasinId.creer(id),
        nom: Nom.creer(nom),
        adresse: Adresse.creer('1 avenue du Général de Gaulle'),
        codePostal: CodePostal.creer('47000'),
        ville: Ville.creer('Agen'),
        centreId,
      },
      new Date('2026-10-01T09:00:00.000Z'),
    );
  }

  it('laisse passer une seule de deux créations de même clé ; l’autre lève MagasinDejaExistant', async () => {
    // Deux transactions qui ont chacune passé le pré-contrôle du use case.
    const resultats = await Promise.allSettled([
      enregistrerDansUneTransaction(
        unMagasin('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b', 'Leclerc Agen Sud'),
      ),
      enregistrerDansUneTransaction(
        unMagasin('5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c', 'LECLERC AGEN-SUD'),
      ),
    ]);

    const reussites = resultats.filter((r) => r.status === 'fulfilled');
    const echecs = resultats.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    expect(reussites).toHaveLength(1);
    expect(echecs).toHaveLength(1);
    expect(echecs[0]?.reason).toBeInstanceOf(MagasinDejaExistant);
    expect((echecs[0]?.reason as Error).cause).toBeDefined();
    expect(await prisma.magasin.count()).toBe(1);
  });
});

describe('PrismaMagasinRepository — écritures simultanées sur un magasin (revue du lot C, B2)', () => {
  const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
  const maintenant = new Date('2026-10-02T10:00:00.000Z');

  beforeEach(async () => {
    await viderLaBase();
    await enregistrerLeCentre();
    await new PrismaMagasinRepository(new PrismaTransaction(prisma)).save(
      Magasin.creer(
        {
          id: magasinId,
          nom: Nom.creer('Leclerc Agen Sud'),
          adresse: Adresse.creer('1 avenue du Général de Gaulle'),
          codePostal: CodePostal.creer('47000'),
          ville: Ville.creer('Agen'),
          centreId,
        },
        maintenant,
      ),
    );
  });

  afterAll(viderLaBase);

  function attendre(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Ajoute une image comme le use case : lire, modifier, enregistrer, valider.
   * `apresLecture` laisse le test entrelacer les deux transactions.
   */
  async function ajouterUneImage(
    imageId: string,
    apresLecture: () => Promise<void>,
  ): Promise<void> {
    const transaction = new PrismaTransaction(prisma);
    const unitOfWork = new PrismaUnitOfWork(prisma, transaction);
    const repository = new PrismaMagasinRepository(transaction);
    await unitOfWork.run(async () => {
      const magasin = await repository.get(magasinId);
      await apresLecture();
      magasin?.ajouterImage(
        {
          id: ImageMagasinId.creer(imageId),
          fichier: FichierImage.creer(`${imageId}.jpg`),
        },
        maintenant,
      );
      if (magasin) {
        await repository.save(magasin);
      }
      await unitOfWork.commit();
    });
  }

  it('garde les deux images de deux ajouts simultanés, à des positions distinctes', async () => {
    // Sans verrou, B lit le magasin avant que A valide, puis efface l'image
    // de A en enregistrant son instantané. Avec le verrou, la lecture de B
    // attend la validation de A.
    let premiereValidee!: () => void;
    const premiereFinie = new Promise<void>((resolve) => {
      premiereValidee = resolve;
    });
    let premiereLue!: () => void;
    const premiereLecture = new Promise<void>((resolve) => {
      premiereLue = resolve;
    });

    const premiere = ajouterUneImage(
      '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d',
      async () => {
        premiereLue();
        await attendre(300); // Laisse à B le temps de lire, s'il le peut.
      },
    ).finally(() => premiereValidee());
    await premiereLecture;
    const seconde = ajouterUneImage(
      '1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e',
      () => premiereFinie,
    );
    await Promise.all([premiere, seconde]);

    const images = await prisma.magasinImage.findMany({
      where: { magasinId: magasinId.valeur },
      orderBy: { ordre: 'asc' },
    });
    expect(images.map((image) => [image.id, image.ordre])).toEqual([
      ['0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d', 0],
      ['1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e', 1],
    ]);
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
