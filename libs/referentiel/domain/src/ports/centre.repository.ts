import type { Centre } from '../centre/centre';

/** Persistance de l'agrégat Centre (TENETS-REPO-001). */
export abstract class CentreRepository {
  /** Enregistre l'agrégat complet (TENETS-REPO-002). */
  abstract save(centre: Centre): Promise<void>;
}
