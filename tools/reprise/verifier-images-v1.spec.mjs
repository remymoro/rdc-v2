import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifierImagesV1 } from './verifier-images-v1.mjs';

const magasinId = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';
const id = '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d';
const prefixe = '/uploads/magasins/' + magasinId + '/';

test('accepte les noms v1 compatibles et servis en v2', () => {
  for (const extension of ['jpg', 'jpeg', 'png', 'webp', 'JPG']) {
    assert.deepEqual(
      verifierImagesV1([
        { id, magasinId, url: prefixe + id + '.' + extension },
      ]),
      [],
    );
  }
});

test('signale chaque URL incompatible sans arrêter le contrôle', () => {
  const urls = [
    prefixe + 'photo.jpg_large',
    prefixe + id + '.html',
    prefixe + id + '.svg',
    prefixe + id + ".Capture d'écran",
    'https://stockage.example/' + id + '.jpg',
    prefixe.replace(magasinId, id) + id + '.jpg',
    prefixe + '../' + id + '.jpg',
    prefixe + id + '.jpg?taille=2',
    null,
  ];
  const anomalies = verifierImagesV1(
    urls.map((url) => ({ id, magasinId, url })),
  );
  assert.equal(anomalies.length, urls.length);
  assert.deepEqual(
    anomalies.map((a) => a.url),
    urls,
  );
  assert.ok(anomalies.every((a) => a.id === id && a.raison.length > 0));
});

test('refuse un export mal formé', () => {
  assert.throws(() => verifierImagesV1({}), /tableau/);
  assert.throws(() => verifierImagesV1([null]), /ligne/);
});
