import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  EXTENSIONS_IMAGES_SERVIES,
  PREFIXE_PUBLIC_IMAGES,
} from '@rdc/referentiel-adapters';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const CHEMIN_AUTORISE = new RegExp(
  '^/' +
    UUID +
    '/' +
    UUID +
    '\\.(' +
    EXTENSIONS_IMAGES_SERVIES.join('|') +
    ')$',
  'i',
);

/** Même restriction en développement et en production (ADR-0022). */
export function servirImagesPubliques(
  app: NestExpressApplication,
  racine: string,
): void {
  const prefixe = PREFIXE_PUBLIC_IMAGES + '/magasins';
  app.use(
    prefixe,
    (
      requete: { path: string },
      reponse: { status: (code: number) => { end: () => void } },
      suivant: () => void,
    ) => {
      // Les noms générés n'ont pas besoin d'encodage URL : rejet aussi des
      // traversées encodées, suffixes .tmp et sous-dossiers.
      if (!CHEMIN_AUTORISE.test(requete.path)) {
        reponse.status(404).end();
        return;
      }
      suivant();
    },
  );
  app.useStaticAssets(join(racine, 'magasins'), {
    prefix: prefixe,
    index: false,
    redirect: false,
    dotfiles: 'deny',
    setHeaders: (reponse) => {
      reponse.setHeader('X-Content-Type-Options', 'nosniff');
      reponse.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; sandbox",
      );
      // Nom UUID jamais réécrit (link sans écrasement) : cache immuable.
      reponse.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  });
}
