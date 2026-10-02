import {
  CentreId,
  CleDoublonMagasin,
  Magasin,
  MagasinDejaExistant,
  MagasinId,
  MagasinRepository,
  StatutMagasin,
} from '@rdc/referentiel-domain';

/** Fake de MagasinRepository pour les tests de use case (TENETS-TEST-002). */
export class MagasinRepositoryEnMemoire extends MagasinRepository {
  private readonly magasins = new Map<string, Magasin>();
  /** Clés reçues, pour vérifier le contrat sémantique du port (TENETS-TEST-006). */
  readonly clesDemandees: CleDoublonMagasin[] = [];

  constructor(magasinsExistants: Magasin[] = []) {
    super();
    magasinsExistants.forEach((magasin) =>
      this.magasins.set(magasin.id.valeur, copie(magasin)),
    );
  }

  async get(id: MagasinId): Promise<Magasin | null> {
    const magasin = this.magasins.get(id.valeur);
    return magasin === undefined ? null : copie(magasin);
  }

  /** Comme la contrainte unique en base : un autre magasin de même clé est refusé. */
  async save(magasin: Magasin): Promise<void> {
    const cle = CleDoublonMagasin.depuis(magasin);
    const doublon = [...this.magasins.values()].some(
      (existant) =>
        !existant.id.equals(magasin.id) &&
        CleDoublonMagasin.depuis(existant).equals(cle),
    );
    if (doublon) {
      throw new MagasinDejaExistant();
    }
    this.magasins.set(magasin.id.valeur, copie(magasin));
  }

  async existsByCleDoublon(cle: CleDoublonMagasin): Promise<boolean> {
    this.clesDemandees.push(cle);
    return [...this.magasins.values()].some((magasin) =>
      CleDoublonMagasin.depuis(magasin).equals(cle),
    );
  }

  async existsNonArchiveDuCentre(centreId: CentreId): Promise<boolean> {
    return [...this.magasins.values()].some(
      (magasin) =>
        magasin.centreId.equals(centreId) &&
        magasin.statut !== StatutMagasin.ARCHIVE,
    );
  }

  magasinsEnregistres(): Magasin[] {
    return [...this.magasins.values()].map(copie);
  }
}

/**
 * Comme une base, le fake garde l'état enregistré et non l'objet reçu : une
 * modification non suivie de save() reste invisible.
 */
function copie(magasin: Magasin): Magasin {
  return Magasin.reconstituer({
    id: magasin.id,
    nom: magasin.nom,
    adresse: magasin.adresse,
    codePostal: magasin.codePostal,
    ville: magasin.ville,
    centreId: magasin.centreId,
    telephone: magasin.telephone,
    email: magasin.email,
    statut: magasin.statut,
    creeLe: new Date(magasin.creeLe.getTime()),
    modifieLe: new Date(magasin.modifieLe.getTime()),
  });
}
