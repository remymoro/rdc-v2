import type { CentreId } from '../centre/centre-id';
import type { Adresse } from '../commun/adresse';
import type { CodePostal } from '../commun/code-postal';
import type { Email } from '../commun/email';
import type { Nom } from '../commun/nom';
import type { Telephone } from '../commun/telephone';
import type { Ville } from '../commun/ville';
import type { MagasinId } from './magasin-id';
import { StatutMagasin } from './statut-magasin';

/** État initial complet d'un nouveau magasin (TENETS-LIFECYCLE-003). */
export interface NouveauMagasin {
  readonly id: MagasinId;
  readonly nom: Nom;
  readonly adresse: Adresse;
  readonly codePostal: CodePostal;
  readonly ville: Ville;
  /** Centre de rattachement permanent (RDC-REF-005). */
  readonly centreId: CentreId;
  /** Facultatif : absent = pas de téléphone (ADR-0007). */
  readonly telephone?: Telephone;
  /** Facultatif : absent = pas d'email (ADR-0007). */
  readonly email?: Email;
}

export class Magasin {
  private constructor(
    readonly id: MagasinId,
    readonly nom: Nom,
    readonly adresse: Adresse,
    readonly codePostal: CodePostal,
    readonly ville: Ville,
    readonly centreId: CentreId,
    readonly telephone: Telephone | undefined,
    readonly email: Email | undefined,
    private statutActuel: StatutMagasin,
    readonly creeLe: Date,
    private derniereModification: Date,
  ) {}

  get statut(): StatutMagasin {
    return this.statutActuel;
  }

  get modifieLe(): Date {
    return this.derniereModification;
  }

  /** Nouveau magasin : le statut initial est décidé ici (TENETS-LIFECYCLE-004). */
  static creer(nouveau: NouveauMagasin, maintenant: Date): Magasin {
    return new Magasin(
      nouveau.id,
      nouveau.nom,
      nouveau.adresse,
      nouveau.codePostal,
      nouveau.ville,
      nouveau.centreId,
      nouveau.telephone,
      nouveau.email,
      StatutMagasin.ACTIF,
      maintenant,
      maintenant,
    );
  }
}
