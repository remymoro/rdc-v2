import { viderLesCentres } from '../support/base-de-donnees';
import { api } from '../support/client-http';

// Parcours HTTP complet, en boîte noire : API NestJS + PostgreSQL (rdc_test).
describe('POST /api/centres/:centreId/magasins', () => {
  const magasinAgenSud = {
    nom: 'Leclerc Agen Sud',
    ville: 'Agen',
    codePostal: '47000',
    adresse: '1 avenue du Général de Gaulle',
  };

  let centreId: string;

  beforeEach(async () => {
    await viderLesCentres(); // CASCADE : vide aussi les magasins.
    const centre = await api.post('/centres', {
      nom: "Centre d'Agen",
      ville: 'Agen',
      codePostal: '47000',
      adresse: '12 avenue Jean Jaurès',
    });
    centreId = centre.data.id;
  });

  it('crée un magasin rattaché au centre et renvoie le MagasinDto (201)', async () => {
    const reponse = await api.post(`/centres/${centreId}/magasins`, {
      ...magasinAgenSud,
      telephone: '05 53 98 76 54',
      email: 'Agen-Sud@Leclerc.fr',
    });

    expect(reponse.status).toBe(201);
    expect(reponse.data).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      nom: 'Leclerc Agen Sud',
      ville: 'Agen',
      codePostal: '47000',
      adresse: '1 avenue du Général de Gaulle',
      telephone: '+33553987654',
      email: 'agen-sud@leclerc.fr',
      statut: 'ACTIF',
      centreId,
      images: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('considère un téléphone ou un email vide comme absent (ADR-0007)', async () => {
    const reponse = await api.post(`/centres/${centreId}/magasins`, {
      ...magasinAgenSud,
      telephone: '',
      email: '   ',
    });

    expect(reponse.status).toBe(201);
    expect(reponse.data).not.toHaveProperty('telephone');
    expect(reponse.data).not.toHaveProperty('email');
  });

  it('refuse une requête mal formée (400 REQUEST_VALIDATION)', async () => {
    const reponse = await api.post(`/centres/${centreId}/magasins`, {
      ville: 'Agen',
    });

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('REQUEST_VALIDATION');
  });

  it('refuse une valeur contraire à une règle métier (400, code du domaine)', async () => {
    const reponse = await api.post(`/centres/${centreId}/magasins`, {
      ...magasinAgenSud,
      adresse: '1 av. du Général de Gaulle',
    });

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('ADRESSE_ABREVIATION_INTERDITE');
  });

  it('refuse un identifiant de centre mal formé (400 CENTRE_ID_INVALID)', async () => {
    const reponse = await api.post(
      '/centres/pas-un-uuid/magasins',
      magasinAgenSud,
    );

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('CENTRE_ID_INVALID');
  });

  it('refuse un centre inconnu (404 CENTRE_NOT_FOUND)', async () => {
    const reponse = await api.post(
      '/centres/0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b/magasins',
      magasinAgenSud,
    );

    expect(reponse.status).toBe(404);
    expect(reponse.data.code).toBe('CENTRE_NOT_FOUND');
  });

  it('refuse un centre inactif (409 CENTRE_NON_ACTIF, RDC-REF-010)', async () => {
    await api.patch(`/centres/${centreId}/desactiver`);

    const reponse = await api.post(
      `/centres/${centreId}/magasins`,
      magasinAgenSud,
    );

    expect(reponse.status).toBe(409);
    expect(reponse.data.code).toBe('CENTRE_NON_ACTIF');
  });

  it('refuse un doublon, même écrit autrement (409 MAGASIN_ALREADY_EXISTS)', async () => {
    await api.post(`/centres/${centreId}/magasins`, magasinAgenSud);

    const reponse = await api.post(`/centres/${centreId}/magasins`, {
      ...magasinAgenSud,
      nom: 'LECLERC AGEN-SUD',
      adresse: '1 avenue du General de Gaulle',
    });

    expect(reponse.status).toBe(409);
    expect(reponse.data).toEqual(
      expect.objectContaining({
        statusCode: 409,
        code: 'MAGASIN_ALREADY_EXISTS',
        path: `/api/centres/${centreId}/magasins`,
      }),
    );
  });
});
