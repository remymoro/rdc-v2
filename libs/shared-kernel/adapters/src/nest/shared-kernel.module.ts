import { Global, Module, OnApplicationShutdown, Scope } from '@nestjs/common';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { SystemClock } from '../horloge/system-clock';
import { PrismaClient } from '../prisma/generated/client';
import { creerPrismaClient } from '../prisma/prisma-client';
import { PrismaTransaction } from '../prisma/prisma-transaction';
import { PrismaUnitOfWork } from '../prisma/prisma-unit-of-work';

/**
 * Composition root des ports techniques communs (TENETS-COMPOSE-001).
 * Une requête HTTP = une PrismaTransaction et une UnitOfWork neuves,
 * partagées par ses repositories (TENETS-UOW-002/004, PATTERN-005).
 */
@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => creerPrismaClient(exigerVariable('DATABASE_URL')),
    },
    {
      provide: PrismaTransaction,
      scope: Scope.REQUEST,
      useFactory: (prisma: PrismaClient) => new PrismaTransaction(prisma),
      inject: [PrismaClient],
    },
    {
      provide: UnitOfWork,
      scope: Scope.REQUEST,
      useFactory: (prisma: PrismaClient, transaction: PrismaTransaction) =>
        new PrismaUnitOfWork(prisma, transaction),
      inject: [PrismaClient, PrismaTransaction],
    },
    { provide: Clock, useFactory: () => new SystemClock() },
  ],
  exports: [PrismaClient, PrismaTransaction, UnitOfWork, Clock],
})
export class SharedKernelModule implements OnApplicationShutdown {
  constructor(private readonly prisma: PrismaClient) {}

  async onApplicationShutdown(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/** La configuration vit dans la composition, pas dans le métier (TENETS-COMPOSE-002). */
function exigerVariable(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) {
    throw new Error(`Variable d'environnement ${nom} manquante`);
  }
  return valeur;
}
