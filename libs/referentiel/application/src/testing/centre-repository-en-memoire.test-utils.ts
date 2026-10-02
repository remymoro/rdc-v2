import {
  Centre,
  CentreDejaExistant,
  CentreId,
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
      this.centres.set(centre.id.valeur, copie(centre)),
    );
  }

  async get(id: CentreId): Promise<Centre | null> {
    const centre = this.centres.get(id.valeur);
    return centre === undefined ? null : copie(centre);
  }

  /** Comme la contrainte unique en base : un autre centre de même clé est refusé. */
  async save(centre: Centre): Promise<void> {
    const cle = CleDoublonCentre.depuis(centre);
    const doublon = [...this.centres.values()].some(
      (existant) =>
        !existant.id.equals(centre.id) &&
        CleDoublonCentre.depuis(existant).equals(cle),
    );
    if (doublon) {
      throw new CentreDejaExistant();
    }
    this.centres.set(centre.id.valeur, copie(centre));
  }

  async existsByCleDoublon(cle: CleDoublonCentre): Promise<boolean> {
    this.clesDemandees.push(cle);
    return [...this.centres.values()].some((centre) =>
      CleDoublonCentre.depuis(centre).equals(cle),
    );
  }

  centresEnregistres(): Centre[] {
    return [...this.centres.values()].map(copie);
  }
}

/**
 * Comme une base, le fake garde l'état enregistré et non l'objet reçu : une
 * modification non suivie de save() reste invisible.
 */
function copie(centre: Centre): Centre {
  return Centre.reconstituer({
    id: centre.id,
    nom: centre.nom,
    adresse: centre.adresse,
    codePostal: centre.codePostal,
    ville: centre.ville,
    telephone: centre.telephone,
    email: centre.email,
    statut: centre.statut,
    creeLe: new Date(centre.creeLe.getTime()),
    modifieLe: new Date(centre.modifieLe.getTime()),
  });
}
