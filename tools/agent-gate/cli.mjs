#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import {
  construireEnvironnement,
  construireEtapes,
  FICHIERS_AGENT_REQUIS,
  verifierPolitiqueDepot,
} from './agent-gate.mjs';

const argumentsCli = new Set(process.argv.slice(2));

if (argumentsCli.has('--help')) {
  console.log(`Usage: pnpm agent:gate [-- --full | --policy-only]

  --full         ajoute migrations, tests d'integration et E2E (PostgreSQL requis)
  --policy-only  ne lance que les controles rapides de politique du depot`);
  process.exit(0);
}

const executer = (commande, options = {}) =>
  spawnSync(commande[0], commande.slice(1), {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: options.heritage ? 'inherit' : 'pipe',
    env: construireEnvironnement(process.env),
  });

const sortieGit = (...argumentsGit) => {
  const resultat = executer(['git', ...argumentsGit]);
  if (resultat.status !== 0) {
    throw new Error(
      resultat.stderr.trim() || 'Impossible de lire le depot Git.',
    );
  }
  return resultat.stdout.trim();
};

const branche =
  process.env.GITHUB_HEAD_REF ||
  sortieGit('branch', '--show-current') ||
  'HEAD-detachee';
const fichiersNonSuivis = sortieGit(
  'ls-files',
  '--others',
  '--exclude-standard',
)
  .split('\n')
  .filter(Boolean);
const fichiersConnus = sortieGit(
  'ls-files',
  '--cached',
  '--others',
  '--exclude-standard',
)
  .split('\n')
  .filter(Boolean);
const fichiersSauvegarde = fichiersConnus.filter((fichier) =>
  /(?:\.orig|\.bak|~)$/.test(fichier),
);

const erreurs = verifierPolitiqueDepot({
  branche,
  fichiersPresents: FICHIERS_AGENT_REQUIS.filter(existsSync),
  fichiersNonSuivis,
  fichiersSauvegarde,
});

console.log(`\nAgent Gate — branche ${branche}`);
if (erreurs.length > 0) {
  console.error('\nFAIL — politique du depot');
  for (const erreur of erreurs) console.error(`  - ${erreur}`);
  process.exit(1);
}
console.log('PASS — politique du depot');

if (!argumentsCli.has('--policy-only')) {
  for (const etape of construireEtapes({
    complet: argumentsCli.has('--full'),
  })) {
    console.log(`\n▶ ${etape.nom}`);
    const resultat = executer(etape.commande, { heritage: true });
    if (resultat.status !== 0) {
      console.error(`\nFAIL — ${etape.nom}`);
      process.exit(resultat.status ?? 1);
    }
  }
}

console.log(`
PASS — controles automatises

Revue humaine encore requise :
  - confirmer le cycle TDD rouge → vert → nettoyage ;
  - citer les regles TENETS-XXX-NNN et RDC-XXX-NNN concernees ;
  - mettre a jour la roadmap, le glossaire et les ADR si necessaire.`);
