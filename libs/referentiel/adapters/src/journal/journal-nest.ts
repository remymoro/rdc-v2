import { type DetailsJournal, Journal } from '@rdc/referentiel-application';

/** Ce que l'adapter utilise du Logger de NestJS. */
export interface Avertisseur {
  warn(message: string): void;
}

/** Adapter du port Journal sur le Logger de NestJS (une ligne par incident). */
export class JournalNest extends Journal {
  constructor(private readonly logger: Avertisseur) {
    super();
  }

  avertir(message: string, details: DetailsJournal, cause?: unknown): void {
    const contexte = Object.entries(details)
      .map(([cle, valeur]) => `${cle}=${valeur}`)
      .join(', ');
    const raison =
      cause === undefined
        ? ''
        : ` — cause : ${cause instanceof Error ? cause.message : String(cause)}`;
    this.logger.warn(`${message} (${contexte})${raison}`);
  }
}
