import { viderLesCentres } from '../support/base-de-donnees';
import { api } from '../support/client-http';

// Parcours HTTP complet, en boîte noire : API NestJS + PostgreSQL (rdc_test).
describe('POST /api/centres', () => {
  const centreAgen = {
    nom: "Centre d'Agen",
    ville: 'Agen',
    codePostal: '47000',
    adresse: '12 avenue Jean Jaurès',
  };

  beforeEach(async () => {
    await viderLesCentres();
  });

  it('crée un centre et renvoie le CentreDto de RDC v1 (201)', async () => {
    const reponse = await api.post('/centres', {
      ...centreAgen,
      telephone: '05 53 12 34 56',
      email: 'Agen@RestosDuCoeur.org',
    });

    expect(reponse.status).toBe(201);
    expect(reponse.data).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      nom: "Centre d'Agen",
      ville: 'Agen',
      codePostal: '47000',
      adresse: '12 avenue Jean Jaurès',
      telephone: '+33553123456',
      email: 'agen@restosducoeur.org',
      statut: 'ACTIF',
      responsablesCount: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('considère un téléphone ou un email vide comme absent (ADR-0007)', async () => {
    const reponse = await api.post('/centres', {
      ...centreAgen,
      telephone: '',
      email: '   ',
    });

    expect(reponse.status).toBe(201);
    expect(reponse.data).not.toHaveProperty('telephone');
    expect(reponse.data).not.toHaveProperty('email');
  });

  it('refuse un doublon, même écrit autrement (409)', async () => {
    await api.post('/centres', centreAgen);

    const reponse = await api.post('/centres', {
      nom: 'CENTRE D AGEN',
      ville: 'AGEN',
      codePostal: '47000',
      adresse: '12 avenue Jean-Jaures',
    });

    expect(reponse.status).toBe(409);
    expect(reponse.data).toEqual(
      expect.objectContaining({
        statusCode: 409,
        code: 'CENTRE_ALREADY_EXISTS',
        path: '/api/centres',
      }),
    );
  });

  it('refuse une valeur contraire à une règle métier (400, code du domaine)', async () => {
    const reponse = await api.post('/centres', {
      ...centreAgen,
      adresse: '12 AV. Jean Jaurès',
    });

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('ADRESSE_ABREVIATION_INTERDITE');
    expect(reponse.data.message).toContain('Avenue');
  });

  it('refuse une requête mal formée (400 REQUEST_VALIDATION)', async () => {
    const reponse = await api.post('/centres', { ville: 'Agen' });

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('REQUEST_VALIDATION');
  });

  it('refuse un champ inconnu (400 REQUEST_VALIDATION)', async () => {
    const reponse = await api.post('/centres', {
      ...centreAgen,
      statut: 'ARCHIVE',
    });

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('REQUEST_VALIDATION');
  });
});
