import nx from '@nx/eslint-plugin';

// Paquets interdits dans les couches pures (ADR-0003, règle R2).
const FRAMEWORK_AND_INFRASTRUCTURE_PACKAGES = [
  '@nestjs/*',
  '@prisma/*',
  'prisma',
  'express',
  'rxjs',
  'axios',
  'class-validator',
  'class-transformer',
  'reflect-metadata',
];

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/prisma/generated'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Frontières entre couches et entre contextes (ADR-0003, règles R1 et R2).
      // Un projet doit respecter toutes les contraintes qui correspondent à ses tags.
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // --- Couches ---
            {
              sourceTag: 'layer:domain',
              onlyDependOnLibsWithTags: ['layer:domain'],
              bannedExternalImports: FRAMEWORK_AND_INFRASTRUCTURE_PACKAGES,
            },
            {
              sourceTag: 'layer:application',
              onlyDependOnLibsWithTags: ['layer:domain', 'layer:application'],
              bannedExternalImports: FRAMEWORK_AND_INFRASTRUCTURE_PACKAGES,
            },
            {
              sourceTag: 'layer:adapters',
              onlyDependOnLibsWithTags: [
                'layer:domain',
                'layer:application',
                'layer:adapters',
              ],
            },
            {
              // L'application NestJS est la composition root : elle câble tout.
              sourceTag: 'layer:composition',
              onlyDependOnLibsWithTags: ['*'],
            },
            {
              // Les tests E2E sont boîte noire : HTTP uniquement, aucune lib.
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: [],
            },
            // --- Contextes métier : ajouter une ligne par nouveau contexte ---
            {
              sourceTag: 'context:referentiel',
              onlyDependOnLibsWithTags: [
                'context:referentiel',
                'context:shared-kernel',
              ],
            },
            {
              sourceTag: 'context:shared-kernel',
              onlyDependOnLibsWithTags: ['context:shared-kernel'],
            },
          ],
        },
      ],
      // Aucun fichier géant (ADR-0003, règle R5).
      'max-lines': [
        'error',
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];

/**
 * Règles des couches pures (domain et application), à importer dans leur
 * eslint.config.mjs. Le temps arrive toujours en paramètre (`now: Date`) ou par
 * le port Clock : lire l'horloge est interdit (ADR-0003, règle R3).
 */
export const pureLayerRules = [
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test-utils.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message:
            "Lecture d'horloge interdite : reçois `now: Date` en paramètre ou passe par le port Clock (ADR-0003, R3).",
        },
        {
          selector:
            "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message:
            "Lecture d'horloge interdite : reçois `now: Date` en paramètre ou passe par le port Clock (ADR-0003, R3).",
        },
      ],
    },
  },
];
