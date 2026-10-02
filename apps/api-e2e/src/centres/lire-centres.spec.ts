import { viderLesCentres } from '../support/base-de-donnees';
import { api } from '../support/client-http';

// Lectures persistées, en boîte noire : API NestJS + PostgreSQL (rdc_test).
describe('GET /api/centres, /api/centres/:id', () => {
  let agen: string;
  let marmande: string;

  async function creerCentre(
    nom: string,
    ville: string,
    codePostal: string,
  ): Promise<string> {
    const reponse = await api.post('/centres', {
      nom,
      ville,
      codePostal,
      adresse: '12 avenue Jean Jaurès',
      email: 'contact@restosducoeur.org',
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
    });
    expect(reponse.status).toBe(201);
    return reponse.data.id;
  }

  beforeEach(async () => {
    await viderLesCentres(); // CASCADE : vide aussi les magasins.
    marmande = await creerCentre('Centre de Marmande', 'Marmande', '47200');
    agen = await creerCentre("Centre d'Agen", 'Agen', '47000');
    await creerMagasin(agen, 'Leclerc Agen Sud');
    const inactif = await creerMagasin(agen, 'Carrefour Agen');
    await api.patch(`/magasins/${inactif}/desactiver`, {});
    const archive = await creerMagasin(agen, 'Lidl Agen');
    await api.patch(`/magasins/${archive}/archiver`, {});
  });

  it('liste les centres triés par nom, avec leurs magasins non archivés (200)', async () => {
    const reponse = await api.get('/centres');

    expect(reponse.status).toBe(200);
    expect(reponse.data).toEqual([
      expect.objectContaining({
        id: agen,
        nom: "Centre d'Agen",
        statut: 'ACTIF',
        email: 'contact@restosducoeur.org',
        responsablesCount: 0,
        magasins: { actifs: 1, inactifs: 1 },
      }),
      expect.objectContaining({
        id: marmande,
        magasins: { actifs: 0, inactifs: 0 },
      }),
    ]);
  });

  it('filtre par statut et cherche dans le nom ou la ville', async () => {
    await api.patch(`/centres/${marmande}/desactiver`, {});

    const inactifs = await api.get('/centres', {
      params: { statut: 'INACTIF' },
    });
    const recherche = await api.get('/centres', {
      params: { recherche: 'AGEN' },
    });

    expect(inactifs.data.map((c: { id: string }) => c.id)).toEqual([marmande]);
    expect(recherche.data.map((c: { id: string }) => c.id)).toEqual([agen]);
  });

  it('refuse un statut inconnu ou un paramètre non prévu (400 REQUEST_VALIDATION)', async () => {
    for (const params of [{ statut: 'SUPPRIME' }, { tri: 'nom' }]) {
      const reponse = await api.get('/centres', { params });

      expect(reponse.status).toBe(400);
      expect(reponse.data).toEqual(
        expect.objectContaining({ code: 'REQUEST_VALIDATION' }),
      );
    }
  });

  it('renvoie le détail d’un centre (200)', async () => {
    const reponse = await api.get(`/centres/${agen}`);

    expect(reponse.status).toBe(200);
    expect(reponse.data).toEqual(
      expect.objectContaining({
        id: agen,
        ville: 'Agen',
        magasins: { actifs: 1, inactifs: 1 },
      }),
    );
  });

  it('répond 404 CENTRE_NOT_FOUND pour un centre inconnu', async () => {
    const inconnu = '0b8f5c3e-2d4a-4f6b-9c1d-7e8f9a0b1c2d';

    const reponse = await api.get(`/centres/${inconnu}`);

    expect(reponse.status).toBe(404);
    expect(reponse.data).toEqual(
      expect.objectContaining({ code: 'CENTRE_NOT_FOUND' }),
    );
  });

  it('répond 400 pour un identifiant mal formé', async () => {
    const reponse = await api.get('/centres/pas-un-uuid');

    expect(reponse.status).toBe(400);
    expect(reponse.data).toEqual(
      expect.objectContaining({ code: 'CENTRE_ID_INVALID' }),
    );
  });
});
