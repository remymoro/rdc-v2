import { Client } from 'pg';

/** État d'un centre tel qu'il est persisté (lecture directe, hors API). */
export interface CentrePersiste {
  readonly statut: string;
  readonly modifieLe: Date;
}

/** Ouvre une connexion sur la base de test, et uniquement sur celle-ci. */
async function connecterLaBaseDeTest(): Promise<Client> {
  const url = process.env['DATABASE_URL'] ?? '';
  if (!url.includes('rdc_test')) {
    throw new Error(
      `Les tests E2E doivent viser la base rdc_test (DATABASE_URL = ${url || 'absente'}).`,
    );
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  return client;
}

/** Vide la table des centres entre deux tests (base de test uniquement). */
export async function viderLesCentres(): Promise<void> {
  const client = await connecterLaBaseDeTest();
  try {
    await client.query('TRUNCATE TABLE "Centre" CASCADE');
  } finally {
    await client.end();
  }
}

/** Relit le statut et la date de modification d'un centre (base de test uniquement). */
export async function lireCentre(id: string): Promise<CentrePersiste | null> {
  const client = await connecterLaBaseDeTest();
  try {
    const resultat = await client.query<CentrePersiste>(
      'SELECT "statut", "updatedAt" AS "modifieLe" FROM "Centre" WHERE "id" = $1',
      [id],
    );
    return resultat.rows[0] ?? null;
  } finally {
    await client.end();
  }
}

/** Relit le statut d'un magasin (base de test uniquement). */
export async function lireStatutMagasin(id: string): Promise<string | null> {
  const client = await connecterLaBaseDeTest();
  try {
    const resultat = await client.query<{ statut: string }>(
      'SELECT "statut" FROM "Magasin" WHERE "id" = $1',
      [id],
    );
    return resultat.rows[0]?.statut ?? null;
  } finally {
    await client.end();
  }
}
