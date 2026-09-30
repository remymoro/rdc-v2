import { Client } from 'pg';

/** Vide la table des centres entre deux tests (base de test uniquement). */
export async function viderLesCentres(): Promise<void> {
  const url = process.env['DATABASE_URL'] ?? '';
  if (!url.includes('rdc_test')) {
    throw new Error(
      `Les tests E2E doivent viser la base rdc_test (DATABASE_URL = ${url || 'absente'}).`,
    );
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('TRUNCATE TABLE "Centre" CASCADE');
  } finally {
    await client.end();
  }
}
