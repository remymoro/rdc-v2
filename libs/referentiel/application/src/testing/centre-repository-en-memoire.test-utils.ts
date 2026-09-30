import {
  Centre,
  CentreRepository,
  CleDoublonCentre,
} from '@rdc/referentiel-domain';

/** Fake de CentreRepository pour les tests de use case (TENETS-TEST-002). */
export class CentreRepositoryEnMemoire extends CentreRepository {
  private readonly centres = new Map<string, Centre>();
  /** Clés reçues, pour vérifier le contrat sémantique du port (TENETS-TEST-006). */
  readonly clesDemandees: CleDoublonCentre[] = [];

  constructor(centresExistants: Centre[] = []) {
    super();
    centresExistants.forEach((centre) =>
      this.centres.set(centre.id.valeur, centre),
    );
  }

  async save(centre: Centre): Promise<void> {
    this.centres.set(centre.id.valeur, centre);
  }

  async existsByCleDoublon(cle: CleDoublonCentre): Promise<boolean> {
    this.clesDemandees.push(cle);
    return [...this.centres.values()].some((centre) =>
      CleDoublonCentre.depuis(centre).equals(cle),
    );
  }

  centresEnregistres(): Centre[] {
    return [...this.centres.values()];
  }
}
