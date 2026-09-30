import { Clock } from '@rdc/shared-kernel-application';

/** Adapter du port Clock : l'heure du système (TENETS-PORT-004). */
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
