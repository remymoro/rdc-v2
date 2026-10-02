import { viderLesCentres } from '../support/base-de-donnees';
import { api } from '../support/client-http';

// Parcours HTTP complet, en boîte noire : API NestJS + PostgreSQL (rdc_test).
describe('PATCH /api/magasins/:id', () => {
  let centreAgen: string;
  let magasinId: string;

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

  async function creerMagasin(centreId: string, nom: string): Promise<string> {
    const reponse = await api.post(`/centres/${centreId}/magasins`, {
      nom,
      ville: 'Agen',
      codePostal: '47000',
      adresse: '1 avenue du Général de Gaulle',
      telephone: '05 53 98 76 54',
    });
    expect(reponse.status).toBe(201);
    return reponse.data.id;
  }

  beforeEach(async () => {
    await viderLesCentres(); // CASCADE : vide aussi les magasins.
    centreAgen = await creerCentre("Centre d'Agen", '12 avenue Jean Jaurès');
    magasinId = await creerMagasin(centreAgen, 'Leclerc Agen Sud');
  });

  it('modifie les champs fournis et renvoie le MagasinDto (200)', async () => {
    const reponse = await api.patch(`/magasins/${magasinId}`, {
      nom: 'Leclerc Agen Nord',
      telephone: null,
    });

    expect(reponse.status).toBe(200);
    expect(reponse.data).toEqual(
      expect.objectContaining({
        id: magasinId,
        nom: 'Leclerc Agen Nord',
        adresse: '1 avenue du Général de Gaulle',
        centreId: centreAgen,
        images: [],
      }),
    );
    expect(reponse.data).not.toHaveProperty('telephone');
  });

  it('transfère le magasin vers un autre centre actif (200)', async () => {
    const autreCentre = await creerCentre(
      'Centre de Boé',
      '3 avenue de la Liberté',
    );

    const reponse = await api.patch(`/magasins/${magasinId}`, {
      centreId: autreCentre,
    });

    expect(reponse.status).toBe(200);
    expect(reponse.data.centreId).toBe(autreCentre);
  });

  it('refuse une valeur contraire à une règle métier (400, code du domaine)', async () => {
    const reponse = await api.patch(`/magasins/${magasinId}`, {
      adresse: '1 av. du Général de Gaulle',
    });

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('ADRESSE_ABREVIATION_INTERDITE');
  });

  it('refuse un champ obligatoire mis à null (400 REQUEST_VALIDATION)', async () => {
    const reponse = await api.patch(`/magasins/${magasinId}`, { nom: null });

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('REQUEST_VALIDATION');
  });

  it('refuse un magasin inconnu (404 MAGASIN_NOT_FOUND)', async () => {
    const reponse = await api.patch(
      '/magasins/5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c',
      { nom: 'Autre' },
    );

    expect(reponse.status).toBe(404);
    expect(reponse.data.code).toBe('MAGASIN_NOT_FOUND');
  });

  it('refuse un transfert vers un centre inconnu (404 CENTRE_NOT_FOUND)', async () => {
    const reponse = await api.patch(`/magasins/${magasinId}`, {
      centreId: '0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b',
    });

    expect(reponse.status).toBe(404);
    expect(reponse.data.code).toBe('CENTRE_NOT_FOUND');
  });

  it('refuse un transfert vers un centre inactif (409 CENTRE_NON_ACTIF)', async () => {
    const autreCentre = await creerCentre(
      'Centre de Boé',
      '3 avenue de la Liberté',
    );
    await api.patch(`/centres/${autreCentre}/desactiver`, {});

    const reponse = await api.patch(`/magasins/${magasinId}`, {
      centreId: autreCentre,
    });

    expect(reponse.status).toBe(409);
    expect(reponse.data.code).toBe('CENTRE_NON_ACTIF');
  });

  it('refuse de modifier un magasin archivé (409 MAGASIN_ARCHIVED)', async () => {
    await api.patch(`/magasins/${magasinId}/archiver`, {});

    const reponse = await api.patch(`/magasins/${magasinId}`, { nom: 'Autre' });

    expect(reponse.status).toBe(409);
    expect(reponse.data.code).toBe('MAGASIN_ARCHIVED');
  });

  it('refuse une modification qui crée un doublon (409 MAGASIN_ALREADY_EXISTS)', async () => {
    await creerMagasin(centreAgen, 'Leclerc Agen Nord');

    const reponse = await api.patch(`/magasins/${magasinId}`, {
      nom: 'LECLERC AGEN-NORD',
    });

    expect(reponse.status).toBe(409);
    expect(reponse.data.code).toBe('MAGASIN_ALREADY_EXISTS');
  });
});
