import { Clock } from '@rdc/shared-kernel-application';

/** Horloge que le test fait avancer (nettoyage horaire, âge des fichiers). */
export class HorlogeReglable extends Clock {
  private instant: Date;

  constructor(depart: Date) {
    super();
    this.instant = new Date(depart.getTime());
  }

  now(): Date {
    return new Date(this.instant.getTime());
  }

  avancer(millisecondes: number): void {
    this.instant = new Date(this.instant.getTime() + millisecondes);
  }
}
