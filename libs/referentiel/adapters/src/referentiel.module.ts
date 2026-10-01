import { Module, Scope } from '@nestjs/common';
import {
  ActiverCentreUseCase,
  ArchiverCentreUseCase,
  CreerCentreUseCase,
  CreerMagasinUseCase,
  DesactiverCentreUseCase,
  GenerateurIdentifiants,
} from '@rdc/referentiel-application';
import { CentreRepository, MagasinRepository } from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { PrismaTransaction } from '@rdc/shared-kernel-adapters';
import { CentresController } from './http/centres.controller';
import { MagasinsController } from './http/magasins.controller';
import { GenerateurIdentifiantsUuid } from './identifiants/generateur-identifiants-uuid';
import { PrismaCentreRepository } from './prisma/prisma-centre.repository';
import { PrismaMagasinRepository } from './prisma/prisma-magasin.repository';

/**
 * Composition root du contexte Référentiel (TENETS-COMPOSE-001) : seul endroit
 * qui connaît à la fois les ports et leurs adapters. Les use cases restent des
 * classes simples, construites par useFactory.
 */
@Module({
  controllers: [CentresController, MagasinsController],
  providers: [
    {
      provide: CentreRepository,
      scope: Scope.REQUEST,
      useFactory: (transaction: PrismaTransaction) =>
        new PrismaCentreRepository(transaction),
      inject: [PrismaTransaction],
    },
    {
      provide: MagasinRepository,
      scope: Scope.REQUEST,
      useFactory: (transaction: PrismaTransaction) =>
        new PrismaMagasinRepository(transaction),
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
    {
      provide: CreerMagasinUseCase,
      scope: Scope.REQUEST,
      useFactory: (
        magasinRepository: MagasinRepository,
        centreRepository: CentreRepository,
        generateurIdentifiants: GenerateurIdentifiants,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) =>
        new CreerMagasinUseCase(
          magasinRepository,
          centreRepository,
          generateurIdentifiants,
          unitOfWork,
          clock,
        ),
      inject: [
        MagasinRepository,
        CentreRepository,
        GenerateurIdentifiants,
        UnitOfWork,
        Clock,
      ],
    },
  ],
})
export class ReferentielModule {}
