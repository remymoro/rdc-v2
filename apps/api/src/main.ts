import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { dossierDesImages } from '@rdc/referentiel-adapters';
import { servirImagesPubliques } from './securite/images-publiques';
import { AppModule } from './app/app.module';
import { verifierDeploiementAutorise } from './securite/deploiement';

// En développement : variables lues depuis .env (fonction native de Node).
// En production, elles sont fournies par l'environnement.
try {
  process.loadEnvFile();
} catch {
  // Pas de fichier .env.
}

async function bootstrap(): Promise<void> {
  verifierDeploiementAutorise(process.env);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  servirImagesPubliques(app, dossierDesImages(process.env));
  const prefixe = 'api';
  app.setGlobalPrefix(prefixe);
  app.enableShutdownHooks();
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`API démarrée sur http://localhost:${port}/${prefixe}`);
}

void bootstrap();
