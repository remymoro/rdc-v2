import type { Centre } from '../centre/centre';
import type { CleDoublonCentre } from '../centre/cle-doublon-centre';

/** Persistance de l'agrégat Centre (TENETS-REPO-001). */
export abstract class CentreRepository {
  /** Enregistre l'agrégat complet (TENETS-REPO-002). */
  abstract save(centre: Centre): Promise<void>;

  /** Un centre de même clé de doublon existe-t-il ? (TENETS-REPO-003/004) */
  abstract existsByCleDoublon(cle: CleDoublonCentre): Promise<boolean>;
}
