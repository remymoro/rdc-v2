import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

// En développement : variables lues depuis .env (fonction native de Node).
// En production, elles sont fournies par l'environnement.
try {
  process.loadEnvFile();
} catch {
  // Pas de fichier .env.
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const prefixe = 'api';
  app.setGlobalPrefix(prefixe);
  app.enableShutdownHooks();
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`API démarrée sur http://localhost:${port}/${prefixe}`);
}

void bootstrap();
