import { UnitOfWork } from '@rdc/shared-kernel-application';

/** Exécute le travail et compte les commits (TENETS-TEST-002, UOW-003). */
export class UnitOfWorkEspion extends UnitOfWork {
  nombreDeCommits = 0;
  /** Vrai pendant run() : permet de vérifier ce qui se passe hors transaction. */
  enCours = false;

  async run<T>(travail: () => Promise<T>): Promise<T> {
    this.enCours = true;
    try {
      return await travail();
    } finally {
      this.enCours = false;
    }
  }

  async commit(): Promise<void> {
    this.nombreDeCommits += 1;
  }
}
