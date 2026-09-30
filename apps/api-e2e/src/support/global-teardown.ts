import { killPort } from '@nx/node/utils';

/** Arrête l'API démarrée pour les tests. */
module.exports = async function (): Promise<void> {
  const port = process.env['PORT'] ? Number(process.env['PORT']) : 3000;
  await killPort(port);
};
