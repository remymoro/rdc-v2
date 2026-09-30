/**
 * Transaction applicative (TENETS-UOW-001).
 * - Une instance représente une seule transaction (TENETS-UOW-002).
 * - Un travail qui se termine sans commit() est annulé (TENETS-UOW-003).
 */
export abstract class UnitOfWork {
  abstract run<T>(travail: () => Promise<T>): Promise<T>;

  /** Dernière instruction d'un travail réussi. */
  abstract commit(): Promise<void>;
}
