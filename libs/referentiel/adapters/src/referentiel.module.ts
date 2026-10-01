import { Module, Scope } from '@nestjs/common';
import {
  ActiverCentreUseCase,
  ArchiverCentreUseCase,
  CreerCentreUseCase,
  DesactiverCentreUseCase,
  GenerateurIdentifiants,
} from '@rdc/referentiel-application';
import { CentreRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { PrismaTransaction } from '@rdc/shared-kernel-adapters';
import { CentresController } from './http/centres.controller';
import { GenerateurIdentifiantsUuid } from './identifiants/generateur-identifiants-uuid';
import { PrismaCentreRepository } from './prisma/prisma-centre.repository';

/**
 * Composition root du contexte Référentiel (TENETS-COMPOSE-001) : seul endroit
 * qui connaît à la fois les ports et leurs adapters. Les use cases restent des
 * classes simples, construites par useFactory.
 */
@Module({
  controllers: [CentresController],
  providers: [
    {
      provide: CentreRepository,
      scope: Scope.REQUEST,
      useFactory: (transaction: PrismaTransaction) =>
        new PrismaCentreRepository(transaction),
      inject: [PrismaTransaction],
    },
    {
      provide: GenerateurIdentifiants,
      useFactory: () => new GenerateurIdentifiantsUuid(),
    },
    {
      provide: CreerCentreUseCase,
      scope: Scope.REQUEST,
      useFactory: (
        centreRepository: CentreRepository,
        generateurIdentifiants: GenerateurIdentifiants,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) =>
        new CreerCentreUseCase(
          centreRepository,
          generateurIdentifiants,
          unitOfWork,
          clock,
        ),
      inject: [CentreRepository, GenerateurIdentifiants, UnitOfWork, Clock],
    },
    {
      provide: DesactiverCentreUseCase,
      scope: Scope.REQUEST,
      useFactory: (
        centreRepository: CentreRepository,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) => new DesactiverCentreUseCase(centreRepository, unitOfWork, clock),
      inject: [CentreRepository, UnitOfWork, Clock],
    },
    {
      provide: ActiverCentreUseCase,
      scope: Scope.REQUEST,
      useFactory: (
        centreRepository: CentreRepository,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) => new ActiverCentreUseCase(centreRepository, unitOfWork, clock),
      inject: [CentreRepository, UnitOfWork, Clock],
    },
    {
      provide: ArchiverCentreUseCase,
      scope: Scope.REQUEST,
      useFactory: (
        centreRepository: CentreRepository,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) => new ArchiverCentreUseCase(centreRepository, unitOfWork, clock),
      inject: [CentreRepository, UnitOfWork, Clock],
    },
  ],
})
export class ReferentielModule {}
