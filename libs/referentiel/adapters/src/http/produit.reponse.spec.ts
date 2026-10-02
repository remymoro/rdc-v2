import { vueVersProduitReponse } from './produit.reponse';

describe('vueVersProduitReponse — ProduitDto', () => {
  it('expose les champs du catalogue', () => {
    expect(
      vueVersProduitReponse({
        id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
        code: 'D000123',
        famille: 'Épicerie',
        sousFamille: 'Pâtes',
        actif: true,
        creeLe: new Date('2026-10-01T09:00:00.000Z'),
        modifieLe: new Date('2026-10-02T14:30:00.000Z'),
      }),
    ).toEqual({
      id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
      code: 'D000123',
      famille: 'Épicerie',
      sousFamille: 'Pâtes',
      actif: true,
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-02T14:30:00.000Z',
    });
  });
});
