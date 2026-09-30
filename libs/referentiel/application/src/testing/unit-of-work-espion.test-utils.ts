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
