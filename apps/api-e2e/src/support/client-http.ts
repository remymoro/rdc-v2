import axios from 'axios';

const hote = process.env['HOST'] ?? 'localhost';
const port = process.env['PORT'] ?? '3000';

/** Client HTTP de l'API : tous les statuts sont renvoyés, sans exception. */
export const api = axios.create({
  baseURL: `http://${hote}:${port}/api`,
  validateStatus: () => true,
});
