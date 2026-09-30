import { verifierDeploiementAutorise } from './deploiement';

describe('verifierDeploiementAutorise (ADR-0009)', () => {
  it("refuse de démarrer en production tant que l'authentification n'existe pas", () => {
    expect(() =>
      verifierDeploiementAutorise({ NODE_ENV: 'production' }),
    ).toThrow('ADR-0009');
  });

  it.each([{ NODE_ENV: 'development' }, { NODE_ENV: 'test' }, {}])(
    'autorise le démarrage hors production (%j)',
    (environnement) => {
      expect(() => verifierDeploiementAutorise(environnement)).not.toThrow();
    },
  );
});
