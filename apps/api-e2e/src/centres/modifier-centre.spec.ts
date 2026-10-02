import { viderLesCentres } from '../support/base-de-donnees';
import { api } from '../support/client-http';

// Parcours HTTP complet, en boîte noire : API NestJS + PostgreSQL (rdc_test).
describe('PATCH /api/centres/:id', () => {
  let agen: string;

  async function creerCentre(nom: string, adresse: string): Promise<string> {
    const reponse = await api.post('/centres', {
      nom,
      ville: 'Agen',
      codePostal: '47000',
      adresse,
      telephone: '05 53 12 34 56',
      email: 'agen@restosducoeur.org',
    });
    expect(reponse.status).toBe(201);
    return reponse.data.id;
  }

  beforeEach(async () => {
    await viderLesCentres();
    agen = await creerCentre("Centre d'Agen", '12 avenue Jean Jaurès');
  });

  it('modifie les champs fournis et renvoie le CentreDto (200)', async () => {
    const reponse = await api.patch(`/centres/${agen}`, {
      nom: "Centre d'Agen Nord",
      ville: 'Le Passage',
      codePostal: '47520',
      email: '',
    });

    expect(reponse.status).toBe(200);
    expect(reponse.data).toEqual(
      expect.objectContaining({
        id: agen,
        nom: "Centre d'Agen Nord",
        ville: 'Le Passage',
        codePostal: '47520',
        adresse: '12 avenue Jean Jaurès',
        telephone: '+33553123456',
        statut: 'ACTIF',
      }),
    );
    expect(reponse.data).not.toHaveProperty('email');

    const relu = await api.get(`/centres/${agen}`);
    expect(relu.data).toEqual(
      expect.objectContaining({
        nom: "Centre d'Agen Nord",
        ville: 'Le Passage',
      }),
    );
    expect(relu.data).not.toHaveProperty('email');
  });

  it('refuse une valeur contraire à une règle métier (400, code du domaine)', async () => {
    const reponse = await api.patch(`/centres/${agen}`, { codePostal: '470' });

    expect(reponse.status).toBe(400);
    expect(reponse.data).toEqual(
      expect.objectContaining({ code: 'CODE_POSTAL_INVALID' }),
    );
  });

  it('refuse un champ obligatoire mis à null (400 REQUEST_VALIDATION)', async () => {
    const reponse = await api.patch(`/centres/${agen}`, { nom: null });

    expect(reponse.status).toBe(400);
    expect(reponse.data).toEqual(
      expect.objectContaining({ code: 'REQUEST_VALIDATION' }),
    );
  });

  it('refuse un centre inconnu (404 CENTRE_NOT_FOUND)', async () => {
    const reponse = await api.patch(
      '/centres/0b8f5c3e-2d4a-4f6b-9c1d-7e8f9a0b1c2d',
      { nom: 'Centre de Boé' },
    );

    expect(reponse.status).toBe(404);
    expect(reponse.data).toEqual(
      expect.objectContaining({ code: 'CENTRE_NOT_FOUND' }),
    );
  });

  it('refuse de modifier un centre archivé (409 CENTRE_ARCHIVED)', async () => {
    await api.patch(`/centres/${agen}/archiver`, {});

    const reponse = await api.patch(`/centres/${agen}`, {
      nom: 'Centre de Boé',
    });

    expect(reponse.status).toBe(409);
    expect(reponse.data).toEqual(
      expect.objectContaining({ code: 'CENTRE_ARCHIVED' }),
    );
  });

  it('refuse une modification qui crée un doublon (409 CENTRE_ALREADY_EXISTS)', async () => {
    await creerCentre('Centre de Boé', '3 avenue de la Liberté');

    const reponse = await api.patch(`/centres/${agen}`, {
      nom: 'CENTRE DE BOE',
      adresse: '3 avenue de la Liberté',
    });

    expect(reponse.status).toBe(409);
    expect(reponse.data).toEqual(
      expect.objectContaining({ code: 'CENTRE_ALREADY_EXISTS' }),
    );
    const relu = await api.get(`/centres/${agen}`);
    expect(relu.data.nom).toBe("Centre d'Agen");
  });
});
