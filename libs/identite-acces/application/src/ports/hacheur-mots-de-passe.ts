import type { MotDePasse, MotDePasseHache } from '@rdc/identite-acces-domain';

/**
 * Hache un mot de passe (RDC-ACCES-007) : lent et non bloquant, avec un sel
 * propre à chaque empreinte. L'algorithme appartient à l'adapter ; le domaine
 * ne lit jamais l'empreinte. La vérification arrive avec la connexion (1d).
 */
export abstract class HacheurMotsDePasse {
  abstract hacher(motDePasse: MotDePasse): Promise<MotDePasseHache>;
}
