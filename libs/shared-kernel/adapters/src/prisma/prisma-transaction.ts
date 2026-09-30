import type { Prisma, PrismaClient } from './generated/client';

/**
 * Ressource transactionnelle partagée par les repositories et la Unit of Work
 * d'une même transaction (TENETS-UOW-004). Hors transaction, elle donne le
 * client de base.
 */
export class PrismaTransaction {
  private clientTransactionnel: Prisma.TransactionClient | null = null;

  constructor(private readonly prisma: PrismaClient) {}

  get client(): Prisma.TransactionClient {
    return this.clientTransactionnel ?? this.prisma;
  }

  /** Réservé à PrismaUnitOfWork. */
  ouvrir(client: Prisma.TransactionClient): void {
    this.clientTransactionnel = client;
  }

  /** Réservé à PrismaUnitOfWork. */
  fermer(): void {
    this.clientTransactionnel = null;
  }
}
