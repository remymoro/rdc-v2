/**
 * Garde-fou de l'ADR-0009 : les routes du référentiel (centres, magasins,
 * produits) ne sont pas encore protégées par authentification. L'API refuse
 * donc de démarrer en production.
 * À SUPPRIMER à l'étape 4, avec l'ajout du contrôle ADMIN et de ses tests.
 */
export function verifierDeploiementAutorise(
  environnement: Record<string, string | undefined>,
): void {
  // Lecture par crochets : la valeur est lue à l'exécution, jamais figée au build.
  if (environnement['NODE_ENV'] === 'production') {
    throw new Error(
      "RDC v2 n'a pas encore d'authentification : déploiement interdit (ADR-0009).",
    );
  }
}
