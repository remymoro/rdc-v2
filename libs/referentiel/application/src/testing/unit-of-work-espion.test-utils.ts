import { UnitOfWork } from '@rdc/shared-kernel-application';

/** Exécute le travail et compte les commits (TENETS-TEST-002, UOW-003). */
export class UnitOfWorkEspion extends UnitOfWork {
  nombreDeCommits = 0;

  async run<T>(travail: () => Promise<T>): Promise<T> {
    return travail();
  }

  async commit(): Promise<void> {
    this.nombreDeCommits += 1;
  }
}

/**
 * Comme PrismaUnitOfWork quand la base refuse la validation : le travail
 * s'exécute, puis run() échoue au moment du commit réel.
 */
export class UnitOfWorkQuiEchoueAuCommit extends UnitOfWorkEspion {
  constructor(private readonly echec: Error) {
    super();
  }

  override async run<T>(travail: () => Promise<T>): Promise<T> {
    await travail();
    throw this.echec;
  }
}
