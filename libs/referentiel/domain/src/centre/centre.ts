import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Email } from '../commun/email';
import { Nom } from '../commun/nom';
import { Telephone } from '../commun/telephone';
import { Ville } from '../commun/ville';
import { CentreArchive, CentreNonActif } from './centre.errors';
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

/**
 * Changements demandés sur un centre : champ absent = inchangé ; `null` =
 * suppression, pour le téléphone et l'email seulement (convention v1).
 * Les valeurs sont déjà validées par leurs value objects (TENETS-VALIDATE-001).
 */
export interface ModificationsCentre {
  readonly nom?: Nom;
  readonly adresse?: Adresse;
  readonly codePostal?: CodePostal;
  readonly ville?: Ville;
  readonly telephone?: Telephone | null;
  readonly email?: Email | null;
}

export class Centre {
  private constructor(
    readonly id: CentreId,
    private nomActuel: Nom,
    private adresseActuelle: Adresse,
    private codePostalActuel: CodePostal,
    private villeActuelle: Ville,
    private telephoneActuel: Telephone | undefined,
    private emailActuel: Email | undefined,
    private statutActuel: StatutCentre,
    readonly creeLe: Date,
    private derniereModification: Date,
  ) {}

  get nom(): Nom {
    return this.nomActuel;
  }

  get adresse(): Adresse {
    return this.adresseActuelle;
  }

  get codePostal(): CodePostal {
    return this.codePostalActuel;
  }

  get ville(): Ville {
    return this.villeActuelle;
  }

  get telephone(): Telephone | undefined {
    return this.telephoneActuel;
  }

  get email(): Email | undefined {
    return this.emailActuel;
  }

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

  /**
   * Un nouveau magasin, bénévole ou planning ne se rattache qu'à un centre
   * ACTIF ; un centre INACTIF ou ARCHIVE garde son historique (RDC-REF-010).
   */
  verifierOuvertAuxRattachements(): void {
    if (this.statutActuel !== StatutCentre.ACTIF) {
      throw new CentreNonActif(this.id);
    }
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

  /**
   * Modifie l'identité ou les contacts du centre. Une modification identique
   * ne change pas `modifieLe`. Un centre archivé ne se modifie plus
   * (RDC-REF-002) ; le use case vérifie l'absence de doublon (RDC-REF-001).
   */
  modifier(changements: ModificationsCentre, maintenant: Date): void {
    if (this.statutActuel === StatutCentre.ARCHIVE) {
      throw new CentreArchive(this.id);
    }
    let modifie = false;

    if (changements.nom && changements.nom.valeur !== this.nomActuel.valeur) {
      this.nomActuel = changements.nom;
      modifie = true;
    }
    if (
      changements.adresse &&
      changements.adresse.valeur !== this.adresseActuelle.valeur
    ) {
      this.adresseActuelle = changements.adresse;
      modifie = true;
    }
    if (
      changements.codePostal &&
      changements.codePostal.valeur !== this.codePostalActuel.valeur
    ) {
      this.codePostalActuel = changements.codePostal;
      modifie = true;
    }
    if (
      changements.ville &&
      changements.ville.valeur !== this.villeActuelle.valeur
    ) {
      this.villeActuelle = changements.ville;
      modifie = true;
    }
    if (
      changements.telephone !== undefined &&
      changements.telephone?.valeur !== this.telephoneActuel?.valeur
    ) {
      this.telephoneActuel = changements.telephone ?? undefined;
      modifie = true;
    }
    if (
      changements.email !== undefined &&
      changements.email?.valeur !== this.emailActuel?.valeur
    ) {
      this.emailActuel = changements.email ?? undefined;
      modifie = true;
    }

    if (modifie) {
      this.derniereModification = maintenant;
    }
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
