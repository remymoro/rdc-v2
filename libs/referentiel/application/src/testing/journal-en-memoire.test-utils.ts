import { type DetailsJournal, Journal } from '../ports/journal';

export interface Avertissement {
  readonly message: string;
  readonly details: DetailsJournal;
  readonly cause?: unknown;
}

/** Fake du journal : garde les avertissements pour les vérifier. */
export class JournalEnMemoire extends Journal {
  readonly avertissements: Avertissement[] = [];

  avertir(message: string, details: DetailsJournal, cause?: unknown): void {
    this.avertissements.push({ message, details, cause });
  }
}
