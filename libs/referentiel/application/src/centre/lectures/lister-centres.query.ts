import { StatutCentre } from '@rdc/referentiel-domain';
import {
  type FiltreCentres,
  LecturesCentres,
  type VueCentre,
} from './lectures-centres';

/** Colonnes triables de la liste des centres. */
export enum TriCentres {
  NOM = 'nom',
  STATUT = 'statut',
  /** Magasins rattachés non archivés : actifs + inactifs (RDC-REF-011). */
  MAGASINS = 'magasins',
}

export enum OrdreTri {
  CROISSANT = 'asc',
  DECROISSANT = 'desc',
}

export interface ListerCentresRequete {
  readonly statut?: StatutCentre;
  /** Texte libre ; vide ou blanc = pas de recherche. */
  readonly recherche?: string;
  /** Absent = par nom. */
  readonly tri?: TriCentres;
  /** Absent = croissant. */
  readonly ordre?: OrdreTri;
}

/** Ordre du cycle de vie, pas l'ordre alphabétique. */
const RANG_STATUT: Record<StatutCentre, number> = {
  [StatutCentre.ACTIF]: 0,
  [StatutCentre.INACTIF]: 1,
  [StatutCentre.ARCHIVE]: 2,
};

const CRITERES: Record<
  Exclude<TriCentres, TriCentres.NOM>,
  (vue: VueCentre) => number
> = {
  [TriCentres.STATUT]: (vue) => RANG_STATUT[vue.statut],
  [TriCentres.MAGASINS]: (vue) => vue.magasins.actifs + vue.magasins.inactifs,
};

/**
 * Les centres (GET /api/centres), filtrés par statut et par recherche dans le
 * nom ou la ville, puis triés. Lecture seule, sans unité de travail. Le port
 * renvoie la liste triée par nom ; les autres tris se font ici, en mémoire
 * (une douzaine de centres), et gardent le nom croissant à égalité.
 */
export class ListerCentresQuery {
  constructor(private readonly lecturesCentres: LecturesCentres) {}

  async execute(requete: ListerCentresRequete): Promise<readonly VueCentre[]> {
    const recherche = requete.recherche?.trim();
    const filtre: FiltreCentres = {
      ...(requete.statut && { statut: requete.statut }),
      ...(recherche && { recherche }),
    };
    const parNom = await this.lecturesCentres.list(filtre);

    const sens = requete.ordre === OrdreTri.DECROISSANT ? -1 : 1;
    const tri = requete.tri ?? TriCentres.NOM;
    if (tri === TriCentres.NOM) {
      return sens === 1 ? parNom : [...parNom].reverse();
    }
    const critere = CRITERES[tri];
    // Array.prototype.sort est stable : l'ordre par nom départage les égalités.
    return [...parNom].sort((a, b) => sens * (critere(a) - critere(b)));
  }
}
