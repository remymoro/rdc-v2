import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const IDENTIFIANT = new RegExp('^' + UUID + '$', 'i');
const FICHIER_SERVI = new RegExp('^' + UUID + '\\.(jpg|jpeg|png|webp)$', 'i');

/** Contrôle en lecture seule d'un export JSON de MagasinImage avant reprise. */
export function verifierImagesV1(lignes) {
  if (!Array.isArray(lignes))
    throw new Error('L’export doit être un tableau JSON.');
  const anomalies = [];
  for (const ligne of lignes) {
    if (!ligne || typeof ligne !== 'object' || Array.isArray(ligne)) {
      throw new Error('Chaque ligne doit être un objet MagasinImage.');
    }
    const { id, magasinId, url } = ligne;
    const prefixe = '/uploads/magasins/' + magasinId + '/';
    if (
      typeof id !== 'string' ||
      !IDENTIFIANT.test(id) ||
      typeof magasinId !== 'string' ||
      !IDENTIFIANT.test(magasinId) ||
      typeof url !== 'string' ||
      !url.startsWith(prefixe) ||
      !FICHIER_SERVI.test(url.slice(prefixe.length))
    ) {
      anomalies.push({
        id,
        magasinId,
        url,
        raison:
          'Identifiant, chemin ou extension incompatible avec les images v2.',
      });
    }
  }
  return anomalies;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.length !== 3)
      throw new Error(
        'Usage : node tools/reprise/verifier-images-v1.mjs export-images.json',
      );
    const anomalies = verifierImagesV1(
      JSON.parse(await readFile(process.argv[2], 'utf8')),
    );
    console.log(JSON.stringify({ anomalies }, null, 2));
    process.exitCode = anomalies.length === 0 ? 0 : 1;
  } catch (erreur) {
    console.error(erreur.message);
    process.exitCode = 2;
  }
}
