import { StatutMagasin } from './statut-magasin';

describe('StatutMagasin', () => {
  it('reprend les trois statuts de RDC v1, sous leur valeur stockée', () => {
    expect(Object.values(StatutMagasin)).toEqual([
      'ACTIF',
      'INACTIF',
      'ARCHIVE',
    ]);
  });
});
