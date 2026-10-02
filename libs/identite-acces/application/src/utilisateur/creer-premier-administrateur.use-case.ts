import {
  AdministrateurDejaExistant,
  Utilisateur,
  UtilisateurRepository,
} from '@rdc/identite-acces-domain';
import { Clock, UnitOfWork } from '@rdc/shared-kernel-application';
import { GenerateurIdentifiants } from '../ports/generateur-identifiants';
import { HacheurMotsDePasse } from '../ports/hacheur-mots-de-passe';
import type { CreerPremierAdministrateurCommande } from './commandes';

/**
 * Crée l'administrateur unique (RDC-ACCES-004, 011), refusé dès qu'il existe.
 * Classe simple, sans NestJS : câblée par le module du contexte
 * (TENETS-COMPOSE-001).
 */
export class CreerPremierAdministrateurUseCase {
  constructor(
    private readonly utilisateurRepository: UtilisateurRepository,
    private readonly hacheurMotsDePasse: HacheurMotsDePasse,
    private readonly generateurIdentifiants: GenerateurIdentifiants,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(
    commande: CreerPremierAdministrateurCommande,
  ): Promise<Utilisateur> {
    // Lecture isolée (TENETS-UOW-011) : un refus ne dépense pas de hachage lent.
    await this.verifierAucunAdministrateur();

    // Hachage hors transaction : aucune connexion tenue pendant le calcul.
    const motDePasse = await this.hacheurMotsDePasse.hacher(
      commande.motDePasse,
    );
    const administrateur = Utilisateur.creerAdministrateur(
      {
        id: this.generateurIdentifiants.nouvelUtilisateurId(),
        adresse: commande.adresse,
        motDePasse,
      },
      this.clock.now(),
    );

    await this.unitOfWork.run(async () => {
      // Revérifié : un autre premier administrateur a pu naître pendant le hachage.
      await this.verifierAucunAdministrateur();
      await this.utilisateurRepository.save(administrateur);
      await this.unitOfWork.commit();
    });

    return administrateur;
  }

  private async verifierAucunAdministrateur(): Promise<void> {
    if (await this.utilisateurRepository.existsAdministrateur()) {
      throw new AdministrateurDejaExistant();
    }
  }
}
