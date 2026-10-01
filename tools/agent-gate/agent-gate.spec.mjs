import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  construireEnvironnement,
  construireEtapes,
  verifierPolitiqueDepot,
} from './agent-gate.mjs';

describe('verifierPolitiqueDepot', () => {
  const etatValide = {
    branche: 'feat/referentiel-cycle-vie-centre',
    fichiersPresents: [
      'AGENTS.md',
      'docs/roadmap.md',
      'docs/domaine/00-index.md',
      'docs/domaine/glossaire.md',
      'docs/architecture/regles/00-index.md',
    ],
    fichiersNonSuivis: [],
    fichiersSauvegarde: [],
  };

  it('accepte une branche de travail et une documentation versionnée', () => {
    assert.deepEqual(verifierPolitiqueDepot(etatValide), []);
  });

  it('accepte tous les types de branche définis par ADR-0010', () => {
    for (const type of ['feat', 'fix', 'docs', 'chore', 'refactor', 'test']) {
      assert.deepEqual(
        verifierPolitiqueDepot({
          ...etatValide,
          branche: `${type}/referentiel-cycle-vie`,
        }),
        [],
      );
    }
  });

  it('refuse main et les noms de branche hors convention', () => {
    assert.match(
      verifierPolitiqueDepot({ ...etatValide, branche: 'main' })[0],
      /branche protégée main/,
    );
    assert.match(
      verifierPolitiqueDepot({ ...etatValide, branche: 'ma-feature' })[0],
      /nom de branche/,
    );
  });

  it('refuse une documentation agent absente ou non versionnée', () => {
    const sansGlossaire = etatValide.fichiersPresents.filter(
      (fichier) => fichier !== 'docs/domaine/glossaire.md',
    );

    const erreurs = verifierPolitiqueDepot({
      ...etatValide,
      fichiersPresents: sansGlossaire,
      fichiersNonSuivis: ['docs/domaine/00-index.md'],
    });

    assert.ok(erreurs.some((erreur) => erreur.includes('glossaire.md')));
    assert.ok(erreurs.some((erreur) => erreur.includes('non versionnée')));
  });

  it('refuse les fichiers de sauvegarde parasites', () => {
    const erreurs = verifierPolitiqueDepot({
      ...etatValide,
      fichiersSauvegarde: ['docs/roadmap.md.orig'],
    });

    assert.match(erreurs[0], /fichier de sauvegarde/);
  });
});

describe('construireEtapes', () => {
  it('exécute les contrôles rapides puis la qualité par défaut', () => {
    assert.deepEqual(construireEtapes({ complet: false }), [
      { nom: 'Formatage', commande: ['pnpm', 'nx', 'format:check'] },
      { nom: 'Lint, tests unitaires et build', commande: ['pnpm', 'verify'] },
    ]);
  });

  it('ajoute migrations, intégration et E2E en mode complet', () => {
    assert.deepEqual(
      construireEtapes({ complet: true }).map((etape) => etape.nom),
      [
        'Formatage',
        'Lint, tests unitaires et build',
        'Migrations Prisma',
        "Tests d'intégration",
        'Tests E2E HTTP',
      ],
    );
  });
});

describe('construireEnvironnement', () => {
  it('désactive les sockets Nx pour rester compatible avec les agents sandboxés', () => {
    assert.deepEqual(construireEnvironnement({ CI: 'true' }), {
      CI: 'true',
      NX_DAEMON: 'false',
      NX_ISOLATE_PLUGINS: 'false',
    });
  });
});
