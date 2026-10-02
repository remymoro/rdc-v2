import type {
  ActiverMagasinCommande,
  ArchiverMagasinCommande,
  DesactiverMagasinCommande,
} from '@rdc/referentiel-application';
import { MagasinId } from '@rdc/referentiel-domain';

/*
 * Paramètre :id de PATCH /api/magasins/:id/{desactiver,activer,archiver} →
 * commande applicative. Pas de ParseUUIDPipe : MagasinId valide l'identifiant
 * (TENETS-VALIDATE-002) ; le corps de la requête est ignoré.
 */

export function versDesactiverMagasinCommande(
  id: string,
): DesactiverMagasinCommande {
  return { magasinId: MagasinId.creer(id) };
}

export function versActiverMagasinCommande(id: string): ActiverMagasinCommande {
  return { magasinId: MagasinId.creer(id) };
}

export function versArchiverMagasinCommande(
  id: string,
): ArchiverMagasinCommande {
  return { magasinId: MagasinId.creer(id) };
}
