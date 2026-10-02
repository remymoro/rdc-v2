import type { AdresseConnexion, MotDePasse } from '@rdc/identite-acces-domain';

/**
 * Création du premier administrateur (RDC-ACCES-004) : les champs sont déjà
 * des value objects, construits par l'adapter primaire (ADR-0003, R8). Le mot
 * de passe arrive en clair et n'est conservé que haché.
 */
export interface CreerPremierAdministrateurCommande {
  readonly adresse: AdresseConnexion;
  readonly motDePasse: MotDePasse;
}
