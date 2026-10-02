import {
  type Centre,
  type CentreId,
  type Magasin,
  StatutMagasin,
} from '@rdc/referentiel-domain';
import {
  type FiltreCentres,
  LecturesCentres,
  type VueCentre,
} from '../centre/lectures/lectures-centres';

/** Fake du port de lecture, alimenté par des agrégats (TENETS-TEST-002). */
export class LecturesCentresEnMemoire extends LecturesCentres {
  private readonly centres = new Map<string, Centre>();
  private readonly magasins = new Map<string, Magasin>();

  constructor(
    centres: readonly Centre[] = [],
    magasins: readonly Magasin[] = [],
  ) {
    super();
    this.enregistrer(centres, magasins);
  }

  enregistrer(
    centres: readonly Centre[],
    magasins: readonly Magasin[] = [],
  ): void {
    centres.forEach((centre) => this.centres.set(centre.id.valeur, centre));
    magasins.forEach((magasin) =>
      this.magasins.set(magasin.id.valeur, magasin),
    );
  }

  async list(filtre: FiltreCentres): Promise<readonly VueCentre[]> {
    const recherche = filtre.recherche?.toLowerCase();
    return [...this.centres.values()]
      .filter((centre) => !filtre.statut || centre.statut === filtre.statut)
      .filter(
        (centre) =>
          !recherche ||
          centre.nom.valeur.toLowerCase().includes(recherche) ||
          centre.ville.valeur.toLowerCase().includes(recherche),
      )
      .map((centre) => this.versVueCentre(centre))
      .sort((a, b) => a.nom.localeCompare(b.nom) || a.id.localeCompare(b.id));
  }

  async get(id: CentreId): Promise<VueCentre | null> {
    const centre = this.centres.get(id.valeur);
    return centre === undefined ? null : this.versVueCentre(centre);
  }

  private versVueCentre(centre: Centre): VueCentre {
    const rattaches = [...this.magasins.values()].filter((magasin) =>
      magasin.centreId.equals(centre.id),
    );
    const compter = (statut: StatutMagasin): number =>
      rattaches.filter((magasin) => magasin.statut === statut).length;
    return {
      id: centre.id.valeur,
      nom: centre.nom.valeur,
      adresse: centre.adresse.valeur,
      codePostal: centre.codePostal.valeur,
      ville: centre.ville.valeur,
      ...(centre.telephone && { telephone: centre.telephone.valeur }),
      ...(centre.email && { email: centre.email.valeur }),
      statut: centre.statut,
      magasins: {
        actifs: compter(StatutMagasin.ACTIF),
        inactifs: compter(StatutMagasin.INACTIF),
      },
      creeLe: centre.creeLe,
      modifieLe: centre.modifieLe,
    };
  }
}
