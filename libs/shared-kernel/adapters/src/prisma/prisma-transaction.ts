import type { Prisma, PrismaClient } from './generated/client';

/**
 * Ressource transactionnelle partagée par les repositories d'une même
 * transaction (TENETS-UOW-004). Hors transaction, elle donne le client de base.
 */
export class PrismaTransaction {
  constructor(private readonly prisma: PrismaClient) {}

  get client(): Prisma.TransactionClient {
    return this.prisma;
  }
}
