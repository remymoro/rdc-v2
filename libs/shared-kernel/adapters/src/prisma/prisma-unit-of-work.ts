import { UnitOfWork } from '@rdc/shared-kernel-application';
import type { PrismaClient } from './generated/client';
import type { PrismaTransaction } from './prisma-transaction';

/** Signal interne : le travail s'est terminé sans commit(), on annule. */
class TravailSansCommit extends Error {}

/**
 * Unit of Work sur une transaction interactive Prisma.
 *
 * Prisma valide la transaction au retour du callback de $transaction :
 * commit() mémorise la demande, et un travail terminé sans commit() lève un
 * signal interne qui provoque l'annulation (TENETS-UOW-003).
 */
export class PrismaUnitOfWork extends UnitOfWork {
  private utilisee = false;
  private commitDemande = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly transaction: PrismaTransaction,
  ) {
    super();
  }

  async run<T>(travail: () => Promise<T>): Promise<T> {
    if (this.utilisee) {
      throw new Error(
        'Une UnitOfWork ne peut pas être réutilisée (TENETS-UOW-002)',
      );
    }
    this.utilisee = true;

    let resultat!: T;
    try {
      await this.prisma.$transaction(async (client) => {
        this.transaction.ouvrir(client);
        resultat = await travail();
        if (!this.commitDemande) {
          throw new TravailSansCommit();
        }
      });
    } catch (erreur) {
      // L'erreur d'origine est relancée telle quelle (TENETS-UOW-010).
      if (!(erreur instanceof TravailSansCommit)) {
        throw erreur;
      }
    } finally {
      this.transaction.fermer(); // TENETS-UOW-005
    }
    return resultat;
  }

  async commit(): Promise<void> {
    if (!this.utilisee || this.commitDemande) {
      throw new Error('commit() doit être appelé une seule fois, dans run()');
    }
    this.commitDemande = true;
  }
}
