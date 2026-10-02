import { lireStatutMagasin, viderLesCentres } from '../support/base-de-donnees';
import { api } from '../support/client-http';

// Parcours HTTP complet, en boîte noire : API NestJS + PostgreSQL (rdc_test).
describe('PATCH /api/magasins/:id/{desactiver,activer,archiver}', () => {
  const magasinInconnu = '5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c';

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
    await viderLesCentres(); // CASCADE : vide aussi les magasins.
  });

  it('désactive puis réactive un magasin (204 sans corps, statut persisté)', async () => {
    const id = await creerUnMagasin();

    const desactivation = await api.patch(`/magasins/${id}/desactiver`, {});
    expect(desactivation.status).toBe(204);
    expect(desactivation.data).toBe('');
    expect(await lireStatutMagasin(id)).toBe('INACTIF');

    const activation = await api.patch(`/magasins/${id}/activer`, {});
    expect(activation.status).toBe(204);
    expect(await lireStatutMagasin(id)).toBe('ACTIF');
  });

  it('archive un magasin : il ne peut plus être activé ni désactivé (409 MAGASIN_ARCHIVED)', async () => {
    const id = await creerUnMagasin();

    const archivage = await api.patch(`/magasins/${id}/archiver`, {});
    expect(archivage.status).toBe(204);
    expect(await lireStatutMagasin(id)).toBe('ARCHIVE');

    for (const action of ['activer', 'desactiver']) {
      const reponse = await api.patch(`/magasins/${id}/${action}`, {});
      expect(reponse.status).toBe(409);
      expect(reponse.data).toEqual(
        expect.objectContaining({
          statusCode: 409,
          code: 'MAGASIN_ARCHIVED',
          path: `/api/magasins/${id}/${action}`,
        }),
      );
    }
    expect(await lireStatutMagasin(id)).toBe('ARCHIVE');
  });

  it.each(['desactiver', 'activer', 'archiver'])(
    '%s : refuse un identifiant mal formé (400 MAGASIN_ID_INVALID)',
    async (action) => {
      const reponse = await api.patch(`/magasins/pas-un-uuid/${action}`, {});

      expect(reponse.status).toBe(400);
      expect(reponse.data.code).toBe('MAGASIN_ID_INVALID');
    },
  );

  it.each(['desactiver', 'activer', 'archiver'])(
    '%s : refuse un magasin inconnu (404 MAGASIN_NOT_FOUND)',
    async (action) => {
      const reponse = await api.patch(
        `/magasins/${magasinInconnu}/${action}`,
        {},
      );

      expect(reponse.status).toBe(404);
      expect(reponse.data.code).toBe('MAGASIN_NOT_FOUND');
    },
  );
});
