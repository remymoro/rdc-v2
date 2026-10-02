import { viderLesProduits } from '../support/base-de-donnees';
import { api } from '../support/client-http';

// Parcours HTTP du catalogue, en boîte noire : API NestJS + PostgreSQL.
describe('catalogue des produits (/api/produits)', () => {
  const pates = { code: 'D000123', famille: 'Épicerie', sousFamille: 'Pâtes' };

  beforeEach(async () => {
    await viderLesProduits();
  });

  it('crée un produit actif et renvoie le ProduitDto (201)', async () => {
    const reponse = await api.post('/produits', { ...pates, code: 'd000123' });

    expect(reponse.status).toBe(201);
    expect(reponse.data).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      code: 'D000123',
      famille: 'Épicerie',
      sousFamille: 'Pâtes',
      actif: true,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('refuse un code mal formé (400 CODE_PRODUIT_INVALID)', async () => {
    const reponse = await api.post('/produits', { ...pates, code: 'X12' });

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('CODE_PRODUIT_INVALID');
  });

  it('refuse une requête incomplète (400 REQUEST_VALIDATION)', async () => {
    const reponse = await api.post('/produits', { code: 'D000123' });

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('REQUEST_VALIDATION');
  });

  it('liste le catalogue trié par code, inactifs compris', async () => {
    const riz = await api.post('/produits', {
      code: 'D000200',
      famille: 'Épicerie',
      sousFamille: 'Riz',
    });
    await api.post('/produits', pates);
    await api.patch(`/produits/${riz.data.id}/desactiver`, {});

    const reponse = await api.get('/produits');

    expect(reponse.status).toBe(200);
    expect(
      reponse.data.map((p: { code: string; actif: boolean }) => [
        p.code,
        p.actif,
      ]),
    ).toEqual([
      ['D000123', true],
      ['D000200', false],
    ]);
  });

  it('modifie un produit (200) puis le désactive et le réactive (204)', async () => {
    const { data } = await api.post('/produits', pates);

    const modification = await api.patch(`/produits/${data.id}`, {
      sousFamille: 'Riz',
    });
    expect(modification.status).toBe(200);
    expect(modification.data).toEqual(
      expect.objectContaining({ code: 'D000123', sousFamille: 'Riz' }),
    );

    expect(
      (await api.patch(`/produits/${data.id}/desactiver`, {})).status,
    ).toBe(204);
    expect((await api.patch(`/produits/${data.id}/activer`, {})).status).toBe(
      204,
    );
    const [produit] = (await api.get('/produits')).data;
    expect(produit.actif).toBe(true);
  });

  it.each([
    ['PATCH', ''],
    ['PATCH', '/activer'],
    ['PATCH', '/desactiver'],
  ])(
    '%s /produits/:id%s refuse un produit inconnu (404 PRODUIT_NOT_FOUND)',
    async (_m, suffixe) => {
      const reponse = await api.patch(
        `/produits/9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d${suffixe}`,
        { famille: 'Hygiène' },
      );

      expect(reponse.status).toBe(404);
      expect(reponse.data.code).toBe('PRODUIT_NOT_FOUND');
    },
  );

  it('refuse un identifiant mal formé (400 PRODUIT_ID_INVALID)', async () => {
    const reponse = await api.patch('/produits/pas-un-uuid/activer', {});

    expect(reponse.status).toBe(400);
    expect(reponse.data.code).toBe('PRODUIT_ID_INVALID');
  });
});
