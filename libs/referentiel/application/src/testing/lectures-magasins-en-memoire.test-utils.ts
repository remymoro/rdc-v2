import type { CentreId, Magasin, MagasinId } from '@rdc/referentiel-domain';
import {
  LecturesMagasins,
  type VueMagasin,
} from '../magasin/lectures/lectures-magasins';

/** Fake du port de lecture, alimenté par des agrégats (TENETS-TEST-002). */
export class LecturesMagasinsEnMemoire extends LecturesMagasins {
  private readonly vues = new Map<string, VueMagasin>();

  constructor(magasins: readonly Magasin[] = []) {
    super();
    this.enregistrer(magasins);
  }

  enregistrer(magasins: readonly Magasin[]): void {
    magasins.forEach((magasin) =>
      this.vues.set(magasin.id.valeur, versVueMagasin(magasin)),
    );
  }

  async list(): Promise<readonly VueMagasin[]> {
    return trierParNom([...this.vues.values()]);
  }

  async listByCentre(centreId: CentreId): Promise<readonly VueMagasin[]> {
    return trierParNom(
      [...this.vues.values()].filter((vue) => vue.centreId === centreId.valeur),
    );
  }

  async get(id: MagasinId): Promise<VueMagasin | null> {
    return this.vues.get(id.valeur) ?? null;
  }
}

function trierParNom(vues: VueMagasin[]): VueMagasin[] {
  return vues.sort(
    (a, b) => a.nom.localeCompare(b.nom) || a.id.localeCompare(b.id),
  );
}

function versVueMagasin(magasin: Magasin): VueMagasin {
  return {
    id: magasin.id.valeur,
    nom: magasin.nom.valeur,
    adresse: magasin.adresse.valeur,
    codePostal: magasin.codePostal.valeur,
    ville: magasin.ville.valeur,
    ...(magasin.telephone && { telephone: magasin.telephone.valeur }),
    ...(magasin.email && { email: magasin.email.valeur }),
    statut: magasin.statut,
    centreId: magasin.centreId.valeur,
    creeLe: magasin.creeLe,
    modifieLe: magasin.modifieLe,
  };
}
