import type { UtilisateurId } from '@rdc/identite-acces-domain';

/** Génère les identifiants des nouveaux objets du contexte (TENETS-PORT-004). */
export abstract class GenerateurIdentifiants {
  abstract nouvelUtilisateurId(): UtilisateurId;
}
