import { viderLesCentres } from '../support/base-de-donnees';
import { api } from '../support/client-http';

// Lectures persistées, en boîte noire : API NestJS + PostgreSQL (rdc_test).
describe('GET /api/magasins, /api/magasins/:id, /api/centres/:centreId/magasins', () => {
  let agen: string;
  let boe: string;

  async function creerCentre(nom: string, adresse: string): Promise<string> {
    const reponse = await api.post('/centres', {
      nom,
      ville: 'Agen',
      codePostal: '47000',
      adresse,
    });
    expect(reponse.status).toBe(201);
    return reponse.data.id;
  }

  async function creerMagasin(
    centreId: string,
    nom: string,
    adresse: string,
  ): Promise<string> {
    const reponse = await api.post(`/centres/${centreId}/magasins`, {
      nom,
      ville: 'Agen',
      codePostal: '47000',
      adresse,
    });
    expect(reponse.status).toBe(201);
    return reponse.data.id;
  }

  beforeEach(async () => {
    await viderLesCentres(); // CASCADE : vide aussi les magasins.
    agen = await creerCentre("Centre d'Agen", '12 avenue Jean Jaurès');
    boe = await creerCentre('Centre de Boé', '3 avenue de la Liberté');
    await creerMagasin(boe, 'Super U Boé', '5 avenue de la Liberté');
    await creerMagasin(
      agen,
      'Leclerc Agen Sud',
      '1 avenue du Général de Gaulle',
    );
    await creerMagasin(agen, 'Carrefour Agen', '2 avenue du Général de Gaulle');
  });

  it('liste tous les magasins, triés par nom (200 MagasinDto[])', async () => {
    const reponse = await api.get('/magasins');

    expect(reponse.status).toBe(200);
    expect(reponse.data.map((m: { nom: string }) => m.nom)).toEqual([
      'Carrefour Agen',
      'Leclerc Agen Sud',
      'Super U Boé',
    ]);
    expect(reponse.data[0]).toEqual(
      expect.objectContaining({ centreId: agen, images: [], statut: 'ACTIF' }),
    );
  });

  it('liste les magasins d’un centre (200)', async () => {
    const reponse = await api.get(`/centres/${agen}/magasins`);

    expect(reponse.status).toBe(200);
    expect(reponse.data.map((m: { nom: string }) => m.nom)).toEqual([
      'Carrefour Agen',
      'Leclerc Agen Sud',
    ]);
  });

  it('renvoie le détail d’un magasin (200 MagasinDto)', async () => {
    const id = await creerMagasin(agen, 'Intermarché Agen', '4 rue Lamennais');

    const reponse = await api.get(`/magasins/${id}`);

    expect(reponse.status).toBe(200);
    expect(reponse.data).toEqual({
      id,
      nom: 'Intermarché Agen',
      ville: 'Agen',
      codePostal: '47000',
      adresse: '4 rue Lamennais',
      statut: 'ACTIF',
      centreId: agen,
      images: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('refuse un magasin inconnu (404 MAGASIN_NOT_FOUND)', async () => {
    const reponse = await api.get(
      '/magasins/5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c',
    );

    expect(reponse.status).toBe(404);
    expect(reponse.data.code).toBe('MAGASIN_NOT_FOUND');
  });

  it('refuse un identifiant mal formé (400)', async () => {
    expect((await api.get('/magasins/pas-un-uuid')).data.code).toBe(
      'MAGASIN_ID_INVALID',
    );
    expect((await api.get('/centres/pas-un-uuid/magasins')).data.code).toBe(
      'CENTRE_ID_INVALID',
    );
  });
});
