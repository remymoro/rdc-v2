/** Source de l'heure courante : le domaine ne lit jamais l'horloge (TENETS-PORT-004). */
export abstract class Clock {
  abstract now(): Date;
}
