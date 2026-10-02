import {
  AdministrateurDejaExistant,
  AdresseConnexion,
  AdresseConnexionDejaUtilisee,
  Role,
  Utilisateur,
  UtilisateurId,
  UtilisateurRepository,
} from '@rdc/identite-acces-domain';

/** Fake de UtilisateurRepository pour les tests de use case (TENETS-TEST-002). */
export class UtilisateurRepositoryEnMemoire extends UtilisateurRepository {
  private readonly utilisateurs = new Map<string, Utilisateur>();

  constructor(utilisateursExistants: Utilisateur[] = []) {
    super();
    // Mêmes contraintes que save() : aucun test ne part d'un état qu'une base refuserait.
    for (const utilisateur of utilisateursExistants) {
      this.verifierContraintes(utilisateur);
      this.utilisateurs.set(utilisateur.id.valeur, copie(utilisateur));
    }
  }

  async get(id: UtilisateurId): Promise<Utilisateur | null> {
    const utilisateur = this.utilisateurs.get(id.valeur);
    return utilisateur === undefined ? null : copie(utilisateur);
  }

  async getByAdresse(adresse: AdresseConnexion): Promise<Utilisateur | null> {
    const utilisateur = this.autres(null).find((existant) =>
      existant.adresse.equals(adresse),
    );
    return utilisateur === undefined ? null : copie(utilisateur);
  }

  async save(utilisateur: Utilisateur): Promise<void> {
    this.verifierContraintes(utilisateur);
    this.utilisateurs.set(utilisateur.id.valeur, copie(utilisateur));
  }

  /** Comme les contraintes uniques en base : un seul admin, une adresse par compte. */
  private verifierContraintes(utilisateur: Utilisateur): void {
    const autres = this.autres(utilisateur.id);
    if (
      utilisateur.role === Role.ADMIN &&
      autres.some((existant) => existant.role === Role.ADMIN)
    ) {
      throw new AdministrateurDejaExistant();
    }
    if (
      autres.some((existant) => existant.adresse.equals(utilisateur.adresse))
    ) {
      throw new AdresseConnexionDejaUtilisee();
    }
  }

  async existsAdministrateur(): Promise<boolean> {
    return this.autres(null).some((existant) => existant.role === Role.ADMIN);
  }

  utilisateursEnregistres(): Utilisateur[] {
    return this.autres(null).map(copie);
  }

  /** Les utilisateurs enregistrés, sauf celui de cet identifiant. */
  private autres(sauf: UtilisateurId | null): Utilisateur[] {
    return [...this.utilisateurs.values()].filter(
      (existant) => sauf === null || !existant.id.equals(sauf),
    );
  }
}

/**
 * Comme une base, le fake garde l'état enregistré et non l'objet reçu : une
 * modification non suivie de save() reste invisible.
 */
function copie(utilisateur: Utilisateur): Utilisateur {
  return Utilisateur.reconstituer({
    id: utilisateur.id,
    role: utilisateur.role,
    adresse: utilisateur.adresse,
    motDePasse: utilisateur.motDePasse,
    centreId: utilisateur.centreId,
    actif: utilisateur.estActif,
    creeLe: new Date(utilisateur.creeLe.getTime()),
    modifieLe: new Date(utilisateur.modifieLe.getTime()),
  });
}
