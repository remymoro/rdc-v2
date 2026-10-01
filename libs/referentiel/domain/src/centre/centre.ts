import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Email } from '../commun/email';
import { Nom } from '../commun/nom';
import { Telephone } from '../commun/telephone';
import { Ville } from '../commun/ville';
import { CentreArchive } from './centre.errors';
import { CentreId } from './centre-id';
import { StatutCentre } from './statut-centre';

/** État initial complet d'un nouveau centre (TENETS-LIFECYCLE-003). */
export interface NouveauCentre {
  readonly id: CentreId;
  readonly nom: Nom;
  readonly adresse: Adresse;
  readonly codePostal: CodePostal;
  readonly ville: Ville;
  /** Facultatif : absent = pas de téléphone (ADR-0007). */
  readonly telephone?: Telephone;
  /** Facultatif : absent = pas d'email (ADR-0007). */
  readonly email?: Email;
}

/** État persisté complet d'un centre existant (TENETS-LIFECYCLE-005). */
export interface EtatCentre extends NouveauCentre {
  readonly statut: StatutCentre;
  readonly creeLe: Date;
  readonly modifieLe: Date;
}

export class Centre {
  private constructor(
    readonly id: CentreId,
    readonly nom: Nom,
    readonly adresse: Adresse,
    readonly codePostal: CodePostal,
    readonly ville: Ville,
    readonly telephone: Telephone | undefined,
    readonly email: Email | undefined,
    private statutActuel: StatutCentre,
    readonly creeLe: Date,
    private derniereModification: Date,
  ) {}

  get statut(): StatutCentre {
    return this.statutActuel;
  }

  get modifieLe(): Date {
    return this.derniereModification;
  }

  /** Nouveau centre : le statut initial est décidé ici (TENETS-LIFECYCLE-004). */
  static creer(nouveau: NouveauCentre, maintenant: Date): Centre {
    return new Centre(
      nouveau.id,
      nouveau.nom,
      nouveau.adresse,
      nouveau.codePostal,
      nouveau.ville,
      nouveau.telephone,
      nouveau.email,
      StatutCentre.ACTIF,
      maintenant,
      maintenant,
    );
  }

  /**
   * Centre existant, relu depuis la base : l'état persisté est restitué tel
   * quel, sans statut initial ni date par défaut (TENETS-LIFECYCLE-005).
   */
  static reconstituer(etat: EtatCentre): Centre {
    return new Centre(
      etat.id,
      etat.nom,
      etat.adresse,
      etat.codePostal,
      etat.ville,
      etat.telephone,
      etat.email,
      etat.statut,
      etat.creeLe,
      etat.modifieLe,
    );
  }

  /** Met le centre en pause : il ne participe plus aux nouvelles opérations. */
  desactiver(maintenant: Date): void {
    if (this.statutActuel === StatutCentre.ARCHIVE) {
      throw new CentreArchive(this.id);
    }

    if (this.statutActuel === StatutCentre.INACTIF) {
      return;
    }

    this.statutActuel = StatutCentre.INACTIF;
    this.derniereModification = maintenant;
  }

  /** Remet en service un centre précédemment désactivé. */
  activer(maintenant: Date): void {
    if (this.statutActuel === StatutCentre.ARCHIVE) {
      throw new CentreArchive(this.id);
    }

    if (this.statutActuel === StatutCentre.ACTIF) {
      return;
    }

    this.statutActuel = StatutCentre.ACTIF;
    this.derniereModification = maintenant;
  }

  /** Retire définitivement le centre : il ne pourra plus changer d'état. */
  archiver(maintenant: Date): void {
    if (this.statutActuel === StatutCentre.ARCHIVE) {
      return;
    }

    this.statutActuel = StatutCentre.ARCHIVE;
    this.derniereModification = maintenant;
  }
}
