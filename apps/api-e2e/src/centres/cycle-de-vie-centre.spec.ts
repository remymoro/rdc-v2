import { lireCentre, viderLesCentres } from '../support/base-de-donnees';
import { api } from '../support/client-http';

// Parcours HTTP complet, en boîte noire : API NestJS + PostgreSQL (rdc_test).
describe('PATCH /api/centres/:id/{desactiver,activer,archiver}', () => {
  const centreInconnu = '0b8f5c3e-2d4a-4f6b-9c1d-7e8f9a0b1c2d';

  async function creerUnCentre(): Promise<string> {
    const reponse = await api.post('/centres', {
      nom: "Centre d'Agen",
      ville: 'Agen',
      codePostal: '47000',
      adresse: '12 avenue Jean Jaurès',
    });
    expect(reponse.status).toBe(201);
    return reponse.data.id;
  }

  beforeEach(async () => {
    await viderLesCentres();
  });

  it('désactive puis réactive un centre (204 sans corps, statut persisté)', async () => {
    const id = await creerUnCentre();

    const desactivation = await api.patch(`/centres/${id}/desactiver`, {});
    expect(desactivation.status).toBe(204);
    expect(desactivation.data).toBe('');
    expect(await lireCentre(id)).toEqual(
      expect.objectContaining({ statut: 'INACTIF' }),
    );

    const activation = await api.patch(`/centres/${id}/activer`, {});
    expect(activation.status).toBe(204);
    expect(activation.data).toBe('');
    expect(await lireCentre(id)).toEqual(
      expect.objectContaining({ statut: 'ACTIF' }),
    );
  });

  it('archive un centre : il ne peut plus être activé ni désactivé (409 CENTRE_ARCHIVED)', async () => {
    const id = await creerUnCentre();

    const archivage = await api.patch(`/centres/${id}/archiver`, {});
    expect(archivage.status).toBe(204);
    expect(archivage.data).toBe('');
    expect(await lireCentre(id)).toEqual(
      expect.objectContaining({ statut: 'ARCHIVE' }),
    );

    for (const action of ['activer', 'desactiver']) {
      const reponse = await api.patch(`/centres/${id}/${action}`, {});
      expect(reponse.status).toBe(409);
      expect(reponse.data).toEqual(
        expect.objectContaining({
          statusCode: 409,
          code: 'CENTRE_ARCHIVED',
          path: `/api/centres/${id}/${action}`,
        }),
      );
    }
    expect(await lireCentre(id)).toEqual(
      expect.objectContaining({ statut: 'ARCHIVE' }),
    );
  });

  it('archiver un centre déjà archivé est sans effet (204, rien de réécrit)', async () => {
    const id = await creerUnCentre();
    await api.patch(`/centres/${id}/archiver`, {});
    const avant = await lireCentre(id);

    const reponse = await api.patch(`/centres/${id}/archiver`, {});

    expect(reponse.status).toBe(204);
    expect(await lireCentre(id)).toEqual({
      statut: 'ARCHIVE',
      modifieLe: avant?.modifieLe,
    });
  });

  it('ignore le corps de la requête (204, statut ARCHIVE en base)', async () => {
    const id = await creerUnCentre();

    const reponse = await api.patch(`/centres/${id}/archiver`, {
      statut: 'ACTIF',
    });

    expect(reponse.status).toBe(204);
    expect(await lireCentre(id)).toEqual(
      expect.objectContaining({ statut: 'ARCHIVE' }),
    );
  });

  it.each(['desactiver', 'activer', 'archiver'])(
    'refuse de %s un centre inconnu (404 CENTRE_NOT_FOUND)',
    async (action) => {
      const reponse = await api.patch(
        `/centres/${centreInconnu}/${action}`,
        {},
      );

      expect(reponse.status).toBe(404);
      expect(reponse.data).toEqual({
        statusCode: 404,
        error: 'CentreIntrouvable',
        message: 'Le centre demandé est introuvable.',
        code: 'CENTRE_NOT_FOUND',
        path: `/api/centres/${centreInconnu}/${action}`,
        timestamp: expect.any(String),
      });
    },
  );

  it.each(['desactiver', 'activer', 'archiver'])(
    'refuse de %s avec un identifiant mal formé (400 CENTRE_ID_INVALID)',
    async (action) => {
      const reponse = await api.patch(`/centres/pas-un-uuid/${action}`, {});

      expect(reponse.status).toBe(400);
      expect(reponse.data.code).toBe('CENTRE_ID_INVALID');
    },
  );

  // Un id fait d'espaces atteint la route et le value object CentreId.
  it.each(['desactiver', 'activer', 'archiver'])(
    'refuse de %s avec un identifiant blanc (400 CENTRE_ID_EMPTY)',
    async (action) => {
      const reponse = await api.patch(`/centres/%20/${action}`, {});

      expect(reponse.status).toBe(400);
      expect(reponse.data.code).toBe('CENTRE_ID_EMPTY');
    },
  );

  // Un id vide ne correspond à aucune route : réponse du filtre global.
  it('répond 404 RESOURCE_NOT_FOUND quand l’identifiant est absent', async () => {
    const reponse = await api.patch('/centres//desactiver', {});

    expect(reponse.status).toBe(404);
    expect(reponse.data.code).toBe('RESOURCE_NOT_FOUND');
  });
});
