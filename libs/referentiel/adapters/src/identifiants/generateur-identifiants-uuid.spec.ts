import {
  CentreId,
  ImageMagasinId,
  MagasinId,
  ProduitId,
} from '@rdc/referentiel-domain';
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

  it('génère un MagasinId valide (UUID), différent à chaque appel', () => {
    const ids = Array.from({ length: 100 }, () =>
      generateur.nouveauMagasinId(),
    );

    expect(ids[0]).toBeInstanceOf(MagasinId);
    expect(new Set(ids.map((id) => id.valeur)).size).toBe(100);
  });

  it('génère un ProduitId valide (UUID), différent à chaque appel', () => {
    const ids = Array.from({ length: 100 }, () =>
      generateur.nouveauProduitId(),
    );

    expect(ids[0]).toBeInstanceOf(ProduitId);
    expect(new Set(ids.map((id) => id.valeur)).size).toBe(100);
  });

  it('génère un ImageMagasinId valide (UUID), différent à chaque appel', () => {
    const ids = Array.from({ length: 100 }, () =>
      generateur.nouvelleImageMagasinId(),
    );

    expect(ids[0]).toBeInstanceOf(ImageMagasinId);
    expect(new Set(ids.map((id) => id.valeur)).size).toBe(100);
  });
});
