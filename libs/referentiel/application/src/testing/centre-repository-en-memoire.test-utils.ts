import { Centre, CentreRepository } from '@rdc/referentiel-domain';

/** Fake de CentreRepository pour les tests de use case (TENETS-TEST-002). */
export class CentreRepositoryEnMemoire extends CentreRepository {
  private readonly centres = new Map<string, Centre>();

  async save(centre: Centre): Promise<void> {
    this.centres.set(centre.id.valeur, centre);
  }

  centresEnregistres(): Centre[] {
    return [...this.centres.values()];
  }
}
