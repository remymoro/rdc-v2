import { LecturesProduitsEnMemoire } from '../../testing/lectures-produits-en-memoire.test-utils';
import { ListerProduitsQuery } from './lister-produits.query';

describe('ListerProduitsQuery', () => {
  it('renvoie le catalogue lu par le port', async () => {
    expect(
      await new ListerProduitsQuery(new LecturesProduitsEnMemoire()).execute(),
    ).toEqual([]);
  });
});
