import type { CentreId } from '../centre/centre-id';
import type { Adresse } from '../commun/adresse';
import type { CodePostal } from '../commun/code-postal';
import type { Email } from '../commun/email';
import type { Nom } from '../commun/nom';
import type { Telephone } from '../commun/telephone';
import type { Ville } from '../commun/ville';
import type { MagasinId } from './magasin-id';
import { MagasinArchive } from './magasin.errors';
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

/** État persisté complet d'un magasin existant (TENETS-LIFECYCLE-005). */
export interface EtatMagasin extends NouveauMagasin {
  readonly statut: StatutMagasin;
  readonly creeLe: Date;
  readonly modifieLe: Date;
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

  /**
   * Magasin existant, relu depuis la base : l'état persisté est restitué tel
   * quel, sans statut initial ni date par défaut (TENETS-LIFECYCLE-005).
   */
  static reconstituer(etat: EtatMagasin): Magasin {
    return new Magasin(
      etat.id,
      etat.nom,
      etat.adresse,
      etat.codePostal,
      etat.ville,
      etat.centreId,
      etat.telephone,
      etat.email,
      etat.statut,
      etat.creeLe,
      etat.modifieLe,
    );
  }

  /** Met le magasin en pause : il ne participe plus aux nouvelles opérations. */
  desactiver(maintenant: Date): void {
    if (this.statutActuel === StatutMagasin.ARCHIVE) {
      throw new MagasinArchive(this.id);
    }

    if (this.statutActuel === StatutMagasin.INACTIF) {
      return;
    }

    this.statutActuel = StatutMagasin.INACTIF;
    this.derniereModification = maintenant;
  }

  /** Remet en service un magasin précédemment désactivé. */
  activer(maintenant: Date): void {
    if (this.statutActuel === StatutMagasin.ARCHIVE) {
      throw new MagasinArchive(this.id);
    }

    if (this.statutActuel === StatutMagasin.ACTIF) {
      return;
    }

    this.statutActuel = StatutMagasin.ACTIF;
    this.derniereModification = maintenant;
  }

  /** Retire définitivement le magasin : il ne pourra plus changer d'état. */
  archiver(maintenant: Date): void {
    if (this.statutActuel === StatutMagasin.ARCHIVE) {
      return;
    }

    this.statutActuel = StatutMagasin.ARCHIVE;
    this.derniereModification = maintenant;
  }
}
