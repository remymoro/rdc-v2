import type { CentreId } from '../centre/centre-id';
import type { CleDoublonMagasin } from '../magasin/cle-doublon-magasin';
import type { Magasin } from '../magasin/magasin';
import type { MagasinId } from '../magasin/magasin-id';

/**
 * Un magasin de même nom, adresse, code postal et ville existe déjà
 * (RDC-REF-001). Levée par le use case qui le détecte avant d'écrire, et par
 * `save` quand le stockage refuse le doublon (créations simultanées,
 * TENETS-ERROR-004, ADAPTER-006).
 */
export class MagasinDejaExistant extends Error {
  readonly code = 'MAGASIN_ALREADY_EXISTS';

  constructor(options?: { readonly cause?: unknown }) {
    super(
      'Un magasin avec le même nom et la même adresse existe déjà.',
      options,
    );
    this.name = 'MagasinDejaExistant';
  }
}

/** Persistance de l'agrégat Magasin (TENETS-REPO-001). */
export abstract class MagasinRepository {
  /** Le magasin, ou null s'il n'existe pas (TENETS-REPO-004/005). */
  abstract get(id: MagasinId): Promise<Magasin | null>;

  /**
   * Enregistre l'agrégat complet (TENETS-REPO-002).
   * @throws MagasinDejaExistant si un autre magasin a la même clé de doublon.
   */
  abstract save(magasin: Magasin): Promise<void>;

  /** Un magasin de même clé de doublon existe-t-il ? (TENETS-REPO-003/004) */
  abstract existsByCleDoublon(cle: CleDoublonMagasin): Promise<boolean>;

  /**
   * Le centre a-t-il encore un magasin ACTIF ou INACTIF rattaché ?
   * (RDC-REF-011, TENETS-REPO-003)
   */
  abstract existsNonArchiveDuCentre(centreId: CentreId): Promise<boolean>;
}
