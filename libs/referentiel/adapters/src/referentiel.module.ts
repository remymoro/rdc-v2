import { Module, Scope } from '@nestjs/common';
import {
  ActiverCentreUseCase,
  ArchiverCentreUseCase,
  CreerCentreUseCase,
  CreerMagasinUseCase,
  ActiverMagasinUseCase,
  ArchiverMagasinUseCase,
  DesactiverMagasinUseCase,
  LecturesMagasins,
  ListerMagasinsDuCentreQuery,
  ListerMagasinsQuery,
  ModifierMagasinUseCase,
  ActiverProduitUseCase,
  CreerProduitUseCase,
  DesactiverProduitUseCase,
  LecturesProduits,
  ListerProduitsQuery,
  ModifierProduitUseCase,
  ObtenirMagasinQuery,
  DesactiverCentreUseCase,
  GenerateurIdentifiants,
} from '@rdc/referentiel-application';
import {
  CentreRepository,
  MagasinRepository,
  ProduitRepository,
} from '@rdc/referentiel-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { PrismaTransaction } from '@rdc/shared-kernel-adapters';
import { CentresController } from './http/centres.controller';
import { MagasinsController } from './http/magasins.controller';
import { ProduitsController } from './http/produits.controller';
import { GenerateurIdentifiantsUuid } from './identifiants/generateur-identifiants-uuid';
import { PrismaCentreRepository } from './prisma/prisma-centre.repository';
import { PrismaLecturesMagasins } from './prisma/prisma-lectures-magasins';
import { PrismaLecturesProduits } from './prisma/prisma-lectures-produits';
import { PrismaProduitRepository } from './prisma/prisma-produit.repository';
import { PrismaMagasinRepository } from './prisma/prisma-magasin.repository';

/**
 * Composition root du contexte Référentiel (TENETS-COMPOSE-001) : seul endroit
 * qui connaît à la fois les ports et leurs adapters. Les use cases restent des
 * classes simples, construites par useFactory.
 */
@Module({
  controllers: [CentresController, MagasinsController, ProduitsController],
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
    {
      provide: DesactiverMagasinUseCase,
      scope: Scope.REQUEST,
      useFactory: (
        magasinRepository: MagasinRepository,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) => new DesactiverMagasinUseCase(magasinRepository, unitOfWork, clock),
      inject: [MagasinRepository, UnitOfWork, Clock],
    },
    {
      provide: ActiverMagasinUseCase,
      scope: Scope.REQUEST,
      useFactory: (
        magasinRepository: MagasinRepository,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) => new ActiverMagasinUseCase(magasinRepository, unitOfWork, clock),
      inject: [MagasinRepository, UnitOfWork, Clock],
    },
    {
      provide: ArchiverMagasinUseCase,
      scope: Scope.REQUEST,
      useFactory: (
        magasinRepository: MagasinRepository,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) => new ArchiverMagasinUseCase(magasinRepository, unitOfWork, clock),
      inject: [MagasinRepository, UnitOfWork, Clock],
    },
    {
      provide: ModifierMagasinUseCase,
      scope: Scope.REQUEST,
      useFactory: (
        magasinRepository: MagasinRepository,
        centreRepository: CentreRepository,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) =>
        new ModifierMagasinUseCase(
          magasinRepository,
          centreRepository,
          unitOfWork,
          clock,
        ),
      inject: [MagasinRepository, CentreRepository, UnitOfWork, Clock],
    },
    {
      provide: LecturesMagasins,
      scope: Scope.REQUEST,
      useFactory: (transaction: PrismaTransaction) =>
        new PrismaLecturesMagasins(transaction),
      inject: [PrismaTransaction],
    },
    {
      provide: ListerMagasinsQuery,
      scope: Scope.REQUEST,
      useFactory: (lectures: LecturesMagasins) =>
        new ListerMagasinsQuery(lectures),
      inject: [LecturesMagasins],
    },
    {
      provide: ListerMagasinsDuCentreQuery,
      scope: Scope.REQUEST,
      useFactory: (lectures: LecturesMagasins) =>
        new ListerMagasinsDuCentreQuery(lectures),
      inject: [LecturesMagasins],
    },
    {
      provide: ObtenirMagasinQuery,
      scope: Scope.REQUEST,
      useFactory: (lectures: LecturesMagasins) =>
        new ObtenirMagasinQuery(lectures),
      inject: [LecturesMagasins],
    },
    {
      provide: ProduitRepository,
      scope: Scope.REQUEST,
      useFactory: (transaction: PrismaTransaction) =>
        new PrismaProduitRepository(transaction),
      inject: [PrismaTransaction],
    },
    {
      provide: LecturesProduits,
      scope: Scope.REQUEST,
      useFactory: (transaction: PrismaTransaction) =>
        new PrismaLecturesProduits(transaction),
      inject: [PrismaTransaction],
    },
    {
      provide: CreerProduitUseCase,
      scope: Scope.REQUEST,
      useFactory: (
        produitRepository: ProduitRepository,
        generateurIdentifiants: GenerateurIdentifiants,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) =>
        new CreerProduitUseCase(
          produitRepository,
          generateurIdentifiants,
          unitOfWork,
          clock,
        ),
      inject: [ProduitRepository, GenerateurIdentifiants, UnitOfWork, Clock],
    },
    ...[
      ModifierProduitUseCase,
      ActiverProduitUseCase,
      DesactiverProduitUseCase,
    ].map((UseCase) => ({
      provide: UseCase,
      scope: Scope.REQUEST,
      useFactory: (
        produitRepository: ProduitRepository,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) => new UseCase(produitRepository, unitOfWork, clock),
      inject: [ProduitRepository, UnitOfWork, Clock],
    })),
    {
      provide: ListerProduitsQuery,
      scope: Scope.REQUEST,
      useFactory: (lectures: LecturesProduits) =>
        new ListerProduitsQuery(lectures),
      inject: [LecturesProduits],
    },
  ],
})
export class ReferentielModule {}
