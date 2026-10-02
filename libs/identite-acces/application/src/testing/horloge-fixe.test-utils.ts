import { Clock } from '@rdc/shared-kernel-application';

/** Horloge arrêtée sur un instant donné. */
export class HorlogeFixe extends Clock {
  constructor(private readonly instant: Date) {
    super();
  }

  now(): Date {
    return new Date(this.instant.getTime());
  }
}
