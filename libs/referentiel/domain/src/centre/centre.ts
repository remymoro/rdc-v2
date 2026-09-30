import { Nom } from '../commun/nom';
import { CentreId } from './centre-id';
import { StatutCentre } from './statut-centre';

export class Centre {
  private constructor(
    readonly id: CentreId,
    readonly nom: Nom,
    readonly statut: StatutCentre,
    readonly creeLe: Date,
    readonly modifieLe: Date,
  ) {}

  /** Nouveau centre : le statut initial est décidé ici (TENETS-LIFECYCLE-004). */
  static creer(params: { id: CentreId; nom: Nom }, maintenant: Date): Centre {
    return new Centre(
      params.id,
      params.nom,
      StatutCentre.ACTIF,
      maintenant,
      maintenant,
    );
  }
}
