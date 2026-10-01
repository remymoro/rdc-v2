export const FICHIERS_AGENT_REQUIS = [
  'AGENTS.md',
  'docs/roadmap.md',
  'docs/domaine/00-index.md',
  'docs/domaine/glossaire.md',
  'docs/architecture/regles/00-index.md',
];

const CONVENTION_BRANCHE =
  /^(feat|fix|docs|chore|refactor|test)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function verifierPolitiqueDepot({
  branche,
  fichiersPresents,
  fichiersNonSuivis,
  fichiersSauvegarde,
}) {
  const erreurs = [];

  if (branche === 'main') {
    erreurs.push(
      'La branche protégée main ne peut pas recevoir de travail direct.',
    );
  } else if (!CONVENTION_BRANCHE.test(branche)) {
    erreurs.push(
      `Le nom de branche « ${branche} » ne respecte pas type/contexte-fonctionnalité.`,
    );
  }

  for (const fichier of FICHIERS_AGENT_REQUIS) {
    if (!fichiersPresents.includes(fichier)) {
      erreurs.push(`Le fichier agent requis ${fichier} est absent.`);
    }
  }

  const documentationNonVersionnee = fichiersNonSuivis.filter(
    (fichier) =>
      fichier === 'AGENTS.md' ||
      fichier.startsWith('docs/domaine/') ||
      fichier.startsWith('docs/architecture/regles/') ||
      fichier.startsWith('docs/adr/'),
  );
  if (documentationNonVersionnee.length > 0) {
    erreurs.push(
      `De la documentation agent est non versionnée : ${documentationNonVersionnee.join(', ')}.`,
    );
  }

  if (fichiersSauvegarde.length > 0) {
    erreurs.push(
      `Un fichier de sauvegarde parasite est présent : ${fichiersSauvegarde.join(', ')}.`,
    );
  }

  return erreurs;
}

export function construireEtapes({ complet }) {
  const etapes = [
    { nom: 'Formatage', commande: ['pnpm', 'nx', 'format:check'] },
    { nom: 'Lint, tests unitaires et build', commande: ['pnpm', 'verify'] },
  ];

  if (complet) {
    etapes.push(
      {
        nom: 'Migrations Prisma',
        commande: ['pnpm', 'prisma', 'migrate', 'deploy'],
      },
      {
        nom: "Tests d'intégration",
        commande: ['pnpm', 'nx', 'run-many', '-t', 'test-integration'],
      },
      { nom: 'Tests E2E HTTP', commande: ['pnpm', 'e2e'] },
    );
  }

  return etapes;
}

export function construireEnvironnement(environnement) {
  return {
    ...environnement,
    NX_DAEMON: 'false',
    NX_ISOLATE_PLUGINS: 'false',
  };
}
