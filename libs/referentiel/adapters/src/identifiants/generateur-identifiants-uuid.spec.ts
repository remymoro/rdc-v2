import { CentreId } from '@rdc/referentiel-domain';
import { GenerateurIdentifiantsUuid } from './generateur-identifiants-uuid';

describe('GenerateurIdentifiantsUuid', () => {
  const generateur = new GenerateurIdentifiantsUuid();

  it('génère un CentreId valide (UUID)', () => {
    const id = generateur.nouveauCentreId();

    expect(id).toBeInstanceOf(CentreId);
    expect(() => CentreId.creer(id.valeur)).not.toThrow();
  });

  it('génère un identifiant différent à chaque appel', () => {
    const ids = new Set(
      Array.from({ length: 100 }, () => generateur.nouveauCentreId().valeur),
    );

    expect(ids.size).toBe(100);
  });
});
