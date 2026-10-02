import type {
  ListerMagasinsDuCentreRequete,
  ObtenirMagasinRequete,
} from '@rdc/referentiel-application';
import { CentreId, MagasinId } from '@rdc/referentiel-domain';

/*
 * Paramètres des lectures → requêtes applicatives. Les value objects valident
 * les identifiants (TENETS-VALIDATE-002), comme pour les écritures.
 */

export function versObtenirMagasinRequete(id: string): ObtenirMagasinRequete {
  return { magasinId: MagasinId.creer(id) };
}

export function versListerMagasinsDuCentreRequete(
  centreId: string,
): ListerMagasinsDuCentreRequete {
  return { centreId: CentreId.creer(centreId) };
}
