import type {
  ActiverCentreCommande,
  ArchiverCentreCommande,
  DesactiverCentreCommande,
} from '@rdc/referentiel-application';
import { CentreId } from '@rdc/referentiel-domain';

/*
 * Paramètre :id de PATCH /api/centres/:id/{desactiver,activer,archiver} →
 * commande applicative. Pas de ParseUUIDPipe : CentreId valide l'identifiant,
 * comme en v1 (TENETS-VALIDATE-002) ; le corps de la requête est ignoré.
 */

export function versDesactiverCentreCommande(
  id: string,
): DesactiverCentreCommande {
  return { centreId: CentreId.creer(id) };
}

export function versActiverCentreCommande(id: string): ActiverCentreCommande {
  return { centreId: CentreId.creer(id) };
}

export function versArchiverCentreCommande(id: string): ArchiverCentreCommande {
  return { centreId: CentreId.creer(id) };
}
