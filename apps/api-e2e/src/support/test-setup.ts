// Exécuté avant chaque fichier de test : variables du .env de la racine
// (sans écraser celles déjà définies, par exemple en CI).
try {
  process.loadEnvFile();
} catch {
  // Pas de fichier .env : variables fournies par l'environnement.
}
