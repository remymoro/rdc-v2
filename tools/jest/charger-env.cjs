// Charge le .env de la racine du workspace sans écraser les variables déjà
// définies (la CI fournit les siennes).
const path = require('node:path');
const { config } = require('dotenv');

config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
