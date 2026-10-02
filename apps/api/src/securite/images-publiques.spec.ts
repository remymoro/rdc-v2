import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { servirImagesPubliques } from './images-publiques';

describe('Images publiques — HTTP', () => {
  let app: NestExpressApplication;
  let racine: string;
  let url: string;
  const magasin = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';
  const image = '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d';
  const chemin = '/uploads/magasins/' + magasin + '/' + image;

  beforeAll(async () => {
    racine = await mkdtemp(join(tmpdir(), 'rdc-public-'));
    const dossier = join(racine, 'magasins', magasin);
    await mkdir(dossier, { recursive: true });
    for (const extension of [
      'jpg',
      'jpeg',
      'png',
      'webp',
      'html',
      'svg',
      'jpg.tmp',
    ]) {
      await writeFile(join(dossier, image + '.' + extension), 'contenu');
    }
    await writeFile(join(racine, 'secret.jpg'), 'confidentiel');
    const module = await Test.createTestingModule({}).compile();
    app = module.createNestApplication<NestExpressApplication>();
    servirImagesPubliques(app, racine);
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });
  afterAll(async () => {
    await app?.close();
    await rm(racine, { recursive: true, force: true });
  });

  it.each(['jpg', 'jpeg', 'png', 'webp'])(
    'sert une image %s avec les en-têtes de protection',
    async (extension) => {
      const reponse = await fetch(url + chemin + '.' + extension);
      expect(reponse.status).toBe(200);
      expect(reponse.headers.get('x-content-type-options')).toBe('nosniff');
      expect(reponse.headers.get('content-security-policy')).toBe(
        "default-src 'none'; sandbox",
      );
    },
  );

  it.each([
    '/uploads/secret.jpg',
    chemin + '.html',
    chemin + '.svg',
    chemin + '.jpg.tmp',
    chemin + '.jpg/intrus',
    '/uploads/magasins/' + magasin + '/',
  ])('refuse %s', async (cible) => {
    expect((await fetch(url + cible)).status).toBe(404);
  });

  it('applique les protections aussi à HEAD', async () => {
    const reponse = await fetch(url + chemin + '.jpg', { method: 'HEAD' });
    expect(reponse.status).toBe(200);
    expect(reponse.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await reponse.text()).toBe('');
  });
});
