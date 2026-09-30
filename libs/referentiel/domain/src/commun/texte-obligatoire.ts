export interface ReglesTexteObligatoire {
  readonly longueurMaximale: number;
  /** « reduits » : toute suite d'espaces à l'intérieur devient un seul espace. */
  readonly espacesInternes: 'conserves' | 'reduits';
  readonly siVide: () => Error;
  readonly siTropLong: (longueurMaximale: number) => Error;
}

/**
 * Normalise un texte obligatoire (espaces) puis vérifie qu'il n'est pas vide
 * et ne dépasse pas sa longueur maximale. Chaque value object garde ses
 * propres erreurs métier (TENETS-ERROR-001).
 */
export function texteObligatoire(
  valeur: string,
  regles: ReglesTexteObligatoire,
): string {
  const sansEspacesAutour = valeur.trim();
  const texte =
    regles.espacesInternes === 'reduits'
      ? sansEspacesAutour.replace(/\s+/g, ' ')
      : sansEspacesAutour;

  if (texte.length === 0) {
    throw regles.siVide();
  }
  if (texte.length > regles.longueurMaximale) {
    throw regles.siTropLong(regles.longueurMaximale);
  }
  return texte;
}
