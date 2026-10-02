import type { AdresseConnexion } from './adresse-connexion';
import type { CentreId, UtilisateurId } from './identifiants';
import type { MotDePasseHache } from './mot-de-passe';
import { Role } from './role';
import {
  AdministrateurNonDesactivable,
  AdministrateurRattacheAUnCentre,
  CompteCentreSansCentre,
} from './utilisateur.errors';

/** État persisté complet d'un utilisateur (TENETS-LIFECYCLE-005). */
export interface EtatUtilisateur {
  readonly id: UtilisateurId;
  readonly role: Role;
  readonly adresse: AdresseConnexion;
  readonly motDePasse: MotDePasseHache;
  /** Le centre d'un compte de centre ; `null` pour l'administrateur. */
  readonly centreId: CentreId | null;
  readonly actif: boolean;
  readonly creeLe: Date;
  readonly modifieLe: Date;
}

interface NouvelUtilisateur {
  readonly id: UtilisateurId;
  readonly adresse: AdresseConnexion;
  readonly motDePasse: MotDePasseHache;
}

/**
 * Ce qui se connecte à RDC : l'administrateur unique du siège ou le compte
 * d'un centre (D-19). Jamais un bénévole. Le mot de passe n'y est connu que
 * par son empreinte.
 */
export class Utilisateur {
  private constructor(
    readonly id: UtilisateurId,
    readonly role: Role,
    private adresseActuelle: AdresseConnexion,
    private motDePasseActuel: MotDePasseHache,
    readonly centreId: CentreId | null,
    private actif: boolean,
    readonly creeLe: Date,
    private derniereModification: Date,
  ) {}

  /** L'administrateur unique, créé par le premier accès (RDC-ACCES-004, 011). */
  static creerAdministrateur(
    nouveau: NouvelUtilisateur,
    maintenant: Date,
  ): Utilisateur {
    return new Utilisateur(
      nouveau.id,
      Role.ADMIN,
      nouveau.adresse,
      nouveau.motDePasse,
      null,
      true,
      maintenant,
      maintenant,
    );
  }

  /** Le compte d'un centre, toujours rattaché à ce centre (RDC-ACCES-001). */
  static creerCompteCentre(
    nouveau: NouvelUtilisateur & { readonly centreId: CentreId },
    maintenant: Date,
  ): Utilisateur {
    return new Utilisateur(
      nouveau.id,
      Role.RESPONSABLE_CENTRE,
      nouveau.adresse,
      nouveau.motDePasse,
      nouveau.centreId,
      true,
      maintenant,
      maintenant,
    );
  }

  /** Revalide la structure : une ligne incohérente n'est pas chargée (ADR-0003 R9). */
  static reconstituer(etat: EtatUtilisateur): Utilisateur {
    if (etat.role === Role.RESPONSABLE_CENTRE && etat.centreId === null) {
      throw new CompteCentreSansCentre(etat.id);
    }
    if (etat.role === Role.ADMIN && etat.centreId !== null) {
      throw new AdministrateurRattacheAUnCentre(etat.id);
    }
    return new Utilisateur(
      etat.id,
      etat.role,
      etat.adresse,
      etat.motDePasse,
      etat.centreId,
      etat.actif,
      etat.creeLe,
      etat.modifieLe,
    );
  }

  get adresse(): AdresseConnexion {
    return this.adresseActuelle;
  }

  get motDePasse(): MotDePasseHache {
    return this.motDePasseActuel;
  }

  get estActif(): boolean {
    return this.actif;
  }

  get modifieLe(): Date {
    return this.derniereModification;
  }

  /**
   * Périmètre (RDC-ACCES-002) : l'administrateur accède à tous les centres,
   * le compte d'un centre à son centre seulement.
   */
  aAccesAuCentre(centreId: CentreId): boolean {
    if (this.role === Role.ADMIN) {
      return true;
    }
    return this.centreId !== null && centreId.equals(this.centreId);
  }

  /** Défini par l'admin, jamais par le centre lui-même (RDC-ACCES-009). */
  changerMotDePasse(motDePasse: MotDePasseHache, maintenant: Date): void {
    this.motDePasseActuel = motDePasse;
    this.derniereModification = maintenant;
  }

  changerAdresse(adresse: AdresseConnexion, maintenant: Date): void {
    if (adresse.equals(this.adresseActuelle)) {
      return;
    }
    this.adresseActuelle = adresse;
    this.derniereModification = maintenant;
  }

  /** Le compte ne peut plus se connecter ; ses sessions sont révoquées par le use case. */
  desactiver(maintenant: Date): void {
    if (this.role === Role.ADMIN) {
      throw new AdministrateurNonDesactivable(this.id);
    }
    if (!this.actif) {
      return;
    }
    this.actif = false;
    this.derniereModification = maintenant;
  }

  activer(maintenant: Date): void {
    if (this.actif) {
      return;
    }
    this.actif = true;
    this.derniereModification = maintenant;
  }

  equals(autre: Utilisateur): boolean {
    return this.id.equals(autre.id);
  }
}
