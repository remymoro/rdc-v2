import { waitForPortOpen } from '@nx/node/utils';

/** Attend que l'API démarrée par `nx e2e` (cible api:serve) écoute. */
module.exports = async function (): Promise<void> {
  const hote = process.env['HOST'] ?? 'localhost';
  const port = process.env['PORT'] ? Number(process.env['PORT']) : 3000;
  await waitForPortOpen(port, { host: hote });
};
