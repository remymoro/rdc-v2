import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

export type { PrismaClient };

/** Client Prisma 7 sur PostgreSQL, via l'adapter pg. */
export function creerPrismaClient(urlBaseDeDonnees: string): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: urlBaseDeDonnees }),
  });
}
