/** Contexte d'un événement journalisé : identifiants techniques, jamais de données personnelles. */
export type DetailsJournal = Readonly<Record<string, string>>;

/**
 * Journal technique (TENETS-PORT-004) : signale un incident sans effet sur le
 * résultat du workflow, mais à surveiller (fichier d'image orphelin…).
 */
export abstract class Journal {
  abstract avertir(
    message: string,
    details: DetailsJournal,
    cause?: unknown,
  ): void;
}
