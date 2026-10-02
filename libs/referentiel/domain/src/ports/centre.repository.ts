import type { Centre } from '../centre/centre';
import type { CentreId } from '../centre/centre-id';
import type { CleDoublonCentre } from '../centre/cle-doublon-centre';

/**
 * Un centre de même nom, adresse, code postal et ville existe déjà
 * (RDC-REF-001). Levée par le use case qui le détecte avant d'écrire, et par
 * `save` quand le stockage refuse le doublon (créations simultanées,
 * TENETS-ERROR-004, ADAPTER-006).
 */
export class CentreDejaExistant extends Error {
  readonly code = 'CENTRE_ALREADY_EXISTS';

  constructor(options?: { readonly cause?: unknown }) {
    super(
      'Un centre avec le même nom et la même adresse existe déjà.',
      options,
    );
    this.name = 'CentreDejaExistant';
  }
}

/** Persistance de l'agrégat Centre (TENETS-REPO-001). */
export abstract class CentreRepository {
  /** Le centre, ou null s'il n'existe pas (TENETS-REPO-004/005). */
  abstract get(id: CentreId): Promise<Centre | null>;

  /**
   * Enregistre l'agrégat complet (TENETS-REPO-002).
   * @throws CentreDejaExistant si un autre centre a la même clé de doublon.
   */
  abstract save(centre: Centre): Promise<void>;

  /** Un centre de même clé de doublon existe-t-il ? (TENETS-REPO-003/004) */
  abstract existsByCleDoublon(cle: CleDoublonCentre): Promise<boolean>;
}
