import type { CentreId } from '@rdc/referentiel-domain';

/** Génère les identifiants des nouveaux objets du contexte (TENETS-PORT-004). */
export abstract class GenerateurIdentifiants {
  abstract nouveauCentreId(): CentreId;
}
