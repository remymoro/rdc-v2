import { resolve } from 'node:path';

/**
 * Préfixe public des images, comme la v1 : nginx sert ce chemin directement
 * depuis le dossier des images ; en développement, l'API le sert elle-même.
 */
export const PREFIXE_PUBLIC_IMAGES = '/uploads';

/**
 * Extensions servies publiquement (ADR-0022) : celles des formats reconnus
 * par le domaine, plus `jpeg` pour les images reprises de la v1. Un test
 * vérifie que chaque format du domaine y figure.
 */
export const EXTENSIONS_IMAGES_SERVIES: readonly string[] = [
  'jpg',
  'jpeg',
  'png',
  'webp',
];

/**
 * Dossier racine des images (ADR-0021) : variable UPLOADS_DIR, comme la v1 ;
 * sur le NAS, le dossier partagé choisi au rendez-vous NAS. Par défaut,
 * `./uploads` (ignoré par git), résolu depuis le dossier courant.
 */
export function dossierDesImages(
  environnement: Record<string, string | undefined>,
): string {
  const configure = environnement['UPLOADS_DIR']?.trim();
  return resolve(configure ? configure : 'uploads');
}
