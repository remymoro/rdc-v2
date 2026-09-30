// Tests d'intégration (PostgreSQL requis : docker compose up -d postgres).
module.exports = {
  displayName: 'shared-kernel-adapters:integration',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: ['<rootDir>/src/**/*.integration.spec.ts'],
  setupFiles: ['<rootDir>/../../../tools/jest/charger-env.cjs'],
};
