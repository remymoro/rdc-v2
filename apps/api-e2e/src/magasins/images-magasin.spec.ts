import axios from 'axios';
import { viderLesCentres } from '../support/base-de-donnees';
import { api } from '../support/client-http';

// Parcours HTTP complet, en boîte noire : API NestJS + PostgreSQL (rdc_test)
// + dossier des images (UPLOADS_DIR, ./uploads par défaut). RDC-REF-007.
describe('POST et DELETE /api/magasins/:id/images', () => {
  const magasinInconnu = '5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c';
  const imageInconnue = '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d';
  const TAILLE_MAXIMALE = 5 * 1024 * 1024;
  const FORMAT_URL =
    /^\/uploads\/magasins\/[0-9a-f-]{36}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

  /** Fichiers servis hors du préfixe /api, comme la v1. */
  const racine = axios.create({
    baseURL: api.defaults.baseURL?.replace(/\/api$/, ''),
    validateStatus: () => true,
    responseType: 'arraybuffer',
  });

  function unJpeg(taille = 64): Uint8Array {
    const octets = new Uint8Array(taille);
    octets.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    return octets;
  }

  function formulaire(
    octets: Uint8Array,
    nom = 'photo.jpg',
    type = 'image/jpeg',
  ): FormData {
    const corps = new FormData();
    corps.append('file', new Blob([octets], { type }), nom);
    return corps;
  }

  async function creerUnMagasin(): Promise<string> {
    const centre = await api.post('/centres', {
      nom: "Centre d'Agen",
      ville: 'Agen',
      codePostal: '47000',
      adresse: '12 avenue Jean Jaurès',
    });
    const magasin = await api.post(`/centres/${centre.data.id}/magasins`, {
      nom: 'Leclerc Agen Sud',
      ville: 'Agen',
      codePostal: '47000',
      adresse: '1 avenue du Général de Gaulle',
    });
    expect(magasin.status).toBe(201);
    return magasin.data.id;
  }

  beforeEach(async () => {
    await viderLesCentres(); // CASCADE : vide aussi les magasins et leurs images.
  });

  it('ajoute une image (201), servie sous /uploads et visible sur le magasin', async () => {
    const id = await creerUnMagasin();
    const octets = unJpeg();

    const reponse = await api.post(
      `/magasins/${id}/images`,
      formulaire(octets),
    );

    expect(reponse.status).toBe(201);
    expect(reponse.data).toEqual({
      id: expect.any(String),
      url: expect.stringMatching(FORMAT_URL),
      ordre: 0,
      createdAt: expect.any(String),
    });
    expect(reponse.data.url).toContain(`/magasins/${id}/`);

    const fichier = await racine.get(reponse.data.url);
    expect(fichier.status).toBe(200);
    expect(new Uint8Array(fichier.data)).toEqual(octets);

    const magasin = await api.get(`/magasins/${id}`);
    expect(magasin.data.images).toEqual([reponse.data]);
  });

  it('ignore le nom envoyé : x./../evil devient <uuid>.jpg dans le dossier du magasin (audit A-18)', async () => {
    const id = await creerUnMagasin();

    const reponse = await api.post(
      `/magasins/${id}/images`,
      formulaire(unJpeg(), 'x./../evil', 'image/png'),
    );

    expect(reponse.status).toBe(201);
    expect(reponse.data.url).toMatch(FORMAT_URL);
    expect(reponse.data.url.startsWith(`/uploads/magasins/${id}/`)).toBe(true);
    expect(reponse.data.url.endsWith('.jpg')).toBe(true);
  });

  it('ordonne les images dans l’ordre d’ajout', async () => {
    const id = await creerUnMagasin();

    await api.post(`/magasins/${id}/images`, formulaire(unJpeg()));
    await api.post(`/magasins/${id}/images`, formulaire(unJpeg()));

    const magasin = await api.get(`/magasins/${id}`);
    expect(magasin.data.images.map((i: { ordre: number }) => i.ordre)).toEqual([
      0, 1,
    ]);
  });

  it('refuse un fichier de 5 Mo + 1 octet (413 IMAGE_TROP_VOLUMINEUSE)', async () => {
    const id = await creerUnMagasin();

    const reponse = await api.post(
      `/magasins/${id}/images`,
      formulaire(unJpeg(TAILLE_MAXIMALE + 1)),
    );

    expect(reponse.status).toBe(413);
    expect(reponse.data).toEqual(
      expect.objectContaining({
        statusCode: 413,
        code: 'IMAGE_TROP_VOLUMINEUSE',
        path: `/api/magasins/${id}/images`,
      }),
    );
    expect((await api.get(`/magasins/${id}`)).data.images).toEqual([]);
  });

  it('accepte un fichier de 5 Mo exactement', async () => {
    const id = await creerUnMagasin();

    const reponse = await api.post(
      `/magasins/${id}/images`,
      formulaire(unJpeg(TAILLE_MAXIMALE)),
    );

    expect(reponse.status).toBe(201);
  });

  it('refuse un PDF annoncé image/jpeg (400 IMAGE_FORMAT_NON_SUPPORTE)', async () => {
    const id = await creerUnMagasin();
    const pdf = new TextEncoder().encode('%PDF-1.7\n%âãÏÓ\n1 0 obj\n');

    const reponse = await api.post(
      `/magasins/${id}/images`,
      formulaire(pdf, 'photo.jpg', 'image/jpeg'),
    );

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('IMAGE_FORMAT_NON_SUPPORTE');
    expect((await api.get(`/magasins/${id}`)).data.images).toEqual([]);
  });

  it('refuse une requête sans fichier (400 REQUEST_VALIDATION)', async () => {
    const id = await creerUnMagasin();

    const reponse = await api.post(`/magasins/${id}/images`, new FormData());

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('REQUEST_VALIDATION');
  });

  it('refuse un magasin inconnu (404 MAGASIN_NOT_FOUND)', async () => {
    const reponse = await api.post(
      `/magasins/${magasinInconnu}/images`,
      formulaire(unJpeg()),
    );

    expect(reponse.status).toBe(404);
    expect(reponse.data.code).toBe('MAGASIN_NOT_FOUND');
  });

  it('retire une image (204) et supprime son fichier', async () => {
    const id = await creerUnMagasin();
    const ajout = await api.post(
      `/magasins/${id}/images`,
      formulaire(unJpeg()),
    );

    const reponse = await api.delete(`/magasins/${id}/images/${ajout.data.id}`);

    expect(reponse.status).toBe(204);
    expect(reponse.data).toBe('');
    expect((await api.get(`/magasins/${id}`)).data.images).toEqual([]);
    expect((await racine.get(ajout.data.url)).status).toBe(404);
  });

  it('refuse de retirer une image absente (400 MAGASIN_IMAGE_INTROUVABLE)', async () => {
    const id = await creerUnMagasin();

    const reponse = await api.delete(`/magasins/${id}/images/${imageInconnue}`);

    expect(reponse.status).toBe(400);
    expect(reponse.data).toEqual(
      expect.objectContaining({
        statusCode: 400,
        code: 'MAGASIN_IMAGE_INTROUVABLE',
      }),
    );
  });

  it('refuse de retirer une image d’un magasin inconnu (404 MAGASIN_NOT_FOUND)', async () => {
    const reponse = await api.delete(
      `/magasins/${magasinInconnu}/images/${imageInconnue}`,
    );

    expect(reponse.status).toBe(404);
    expect(reponse.data.code).toBe('MAGASIN_NOT_FOUND');
  });

  it('refuse un identifiant d’image mal formé (400 IMAGE_ID_INVALID)', async () => {
    const id = await creerUnMagasin();

    const reponse = await api.delete(`/magasins/${id}/images/pas-un-uuid`);

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('IMAGE_ID_INVALID');
  });
});
