import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ReferentielModule } from '@rdc/referentiel-adapters';
import { SharedKernelModule } from '@rdc/shared-kernel-adapters';
import { ErreursHttpGlobalesFilter } from '../http/erreurs-http-globales.filter';

/** Composition root de l'application : un module par contexte. */
@Module({
  imports: [SharedKernelModule, ReferentielModule],
  providers: [
    {
      // Forme des requêtes uniquement (TENETS-VALIDATE-002), comme en v1.
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
    },
    { provide: APP_FILTER, useClass: ErreursHttpGlobalesFilter },
  ],
})
export class AppModule {}
