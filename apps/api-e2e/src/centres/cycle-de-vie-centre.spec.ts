import { viderLesCentres } from '../support/base-de-donnees';
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

  it('désactive puis réactive un centre (204 sans corps)', async () => {
    const id = await creerUnCentre();

    const desactivation = await api.patch(`/centres/${id}/desactiver`, {});
    expect(desactivation.status).toBe(204);
    expect(desactivation.data).toBe('');

    const activation = await api.patch(`/centres/${id}/activer`, {});
    expect(activation.status).toBe(204);
    expect(activation.data).toBe('');
  });

  it('archive un centre : il ne peut plus être activé ni désactivé (409 CENTRE_ARCHIVED)', async () => {
    const id = await creerUnCentre();

    const archivage = await api.patch(`/centres/${id}/archiver`, {});
    expect(archivage.status).toBe(204);
    expect(archivage.data).toBe('');

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
  });

  it('archiver un centre déjà archivé est sans effet (204)', async () => {
    const id = await creerUnCentre();
    await api.patch(`/centres/${id}/archiver`, {});

    const reponse = await api.patch(`/centres/${id}/archiver`, {});

    expect(reponse.status).toBe(204);
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
});
