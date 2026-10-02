import type { AdresseConnexion } from '../utilisateur/adresse-connexion';
import type { UtilisateurId } from '../utilisateur/identifiants';
import type { Utilisateur } from '../utilisateur/utilisateur';

/**
 * Un administrateur existe déjà : il est unique (RDC-ACCES-004, 011). Levée
 * par le use case qui le détecte avant d'écrire, et par `save` quand le
 * stockage refuse un second administrateur (créations simultanées,
 * TENETS-ERROR-004, ADAPTER-006).
 */
export class AdministrateurDejaExistant extends Error {
  readonly code = 'AUTH_BOOTSTRAP_DISABLED'; // code v1

  constructor(options?: { readonly cause?: unknown }) {
    super('Un administrateur existe déjà.', options);
    this.name = 'AdministrateurDejaExistant';
  }
}

/**
 * L'adresse de connexion appartient déjà à un autre utilisateur : elle est
 * unique parmi tous les comptes (RDC-ACCES-010).
 */
export class AdresseConnexionDejaUtilisee extends Error {
  readonly code = 'AUTH_EMAIL_ALREADY_EXISTS'; // code v1

  constructor(options?: { readonly cause?: unknown }) {
    super('Cette adresse de connexion est déjà utilisée.', options);
    this.name = 'AdresseConnexionDejaUtilisee';
  }
}

/** Persistance de l'agrégat Utilisateur (TENETS-REPO-001). */
export abstract class UtilisateurRepository {
  /** L'utilisateur, ou null s'il n'existe pas (TENETS-REPO-004/005). */
  abstract get(id: UtilisateurId): Promise<Utilisateur | null>;

  /** L'utilisateur de cette adresse de connexion, ou null. */
  abstract getByAdresse(adresse: AdresseConnexion): Promise<Utilisateur | null>;

  /**
   * Enregistre l'agrégat complet (TENETS-REPO-002).
   * @throws AdministrateurDejaExistant pour un second administrateur.
   * @throws AdresseConnexionDejaUtilisee si un autre utilisateur a l'adresse.
   */
  abstract save(utilisateur: Utilisateur): Promise<void>;

  /** Un administrateur existe-t-il ? (RDC-ACCES-004) */
  abstract existsAdministrateur(): Promise<boolean>;
}
