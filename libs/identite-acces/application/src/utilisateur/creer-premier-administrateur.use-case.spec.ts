import {
  AdministrateurDejaExistant,
  AdresseConnexion,
  AdresseConnexionDejaUtilisee,
  CentreId,
  MotDePasse,
  MotDePasseHache,
  Role,
  Utilisateur,
  UtilisateurId,
} from '@rdc/identite-acces-domain';
import { GenerateurIdentifiantsFixe } from '../testing/generateur-identifiants-fixe.test-utils';
import { HacheurMotsDePasseFactice } from '../testing/hacheur-mots-de-passe-factice.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import { UtilisateurRepositoryEnMemoire } from '../testing/utilisateur-repository-en-memoire.test-utils';
import type { CreerPremierAdministrateurCommande } from './commandes';
import { CreerPremierAdministrateurUseCase } from './creer-premier-administrateur.use-case';

describe('CreerPremierAdministrateurUseCase (RDC-ACCES-004, 011)', () => {
  const maintenant = new Date('2026-10-02T10:00:00.000Z');
  const idGenere = UtilisateurId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
  const enClair = 'mot-de-passe-du-siege';

  let utilisateurRepository: UtilisateurRepositoryEnMemoire;
  let hacheur: HacheurMotsDePasseFactice;
  let unitOfWork: UnitOfWorkEspion;
  let creerPremierAdministrateur: CreerPremierAdministrateurUseCase;

  function preparer(
    existants: Utilisateur[] = [],
    repository = new UtilisateurRepositoryEnMemoire(existants),
  ): void {
    utilisateurRepository = repository;
    unitOfWork = new UnitOfWorkEspion();
    hacheur = new HacheurMotsDePasseFactice(() => unitOfWork.enCours);
    creerPremierAdministrateur = new CreerPremierAdministrateurUseCase(
      utilisateurRepository,
      hacheur,
      new GenerateurIdentifiantsFixe({ utilisateurId: idGenere }),
      unitOfWork,
      new HorlogeFixe(maintenant),
    );
  }

  function commande(
    adresse = 'siege@ad47.org',
  ): CreerPremierAdministrateurCommande {
    return {
      adresse: AdresseConnexion.creer(adresse),
      motDePasse: MotDePasse.creer(enClair),
    };
  }

  function unAdministrateurExistant(): Utilisateur {
    return Utilisateur.creerAdministrateur(
      {
        id: UtilisateurId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b'),
        adresse: AdresseConnexion.creer('ancien@ad47.org'),
        motDePasse: MotDePasseHache.creer('scrypt$sel$empreinte-existante'),
      },
      maintenant,
    );
  }

  it('crée l’administrateur unique et l’enregistre en une transaction', async () => {
    preparer();

    const administrateur = await creerPremierAdministrateur.execute(commande());

    expect(administrateur.id.equals(idGenere)).toBe(true);
    expect(administrateur.role).toBe(Role.ADMIN);
    expect(administrateur.adresse.valeur).toBe('siege@ad47.org');
    expect(administrateur.creeLe).toEqual(maintenant);
    const enregistre = await utilisateurRepository.get(idGenere);
    expect(enregistre?.role).toBe(Role.ADMIN);
    expect(unitOfWork.nombreDeCommits).toBe(1);
  });

  it('n’enregistre que l’empreinte, jamais le mot de passe en clair (RDC-ACCES-007)', async () => {
    preparer();

    await creerPremierAdministrateur.execute(commande());

    const enregistre = await utilisateurRepository.get(idGenere);
    expect(enregistre?.motDePasse.valeur).toBe(
      HacheurMotsDePasseFactice.empreinteDe(enClair),
    );
    expect(enregistre?.motDePasse.valeur).not.toContain(enClair);
    expect(hacheur.motsDePasseRecus).toHaveLength(1);
    expect(hacheur.motsDePasseRecus[0]).toBeInstanceOf(MotDePasse);
    expect(hacheur.motsDePasseRecus[0].valeur).toBe(enClair);
  });

  it('hache hors transaction : aucune connexion tenue pendant le calcul (TENETS-UOW-011)', async () => {
    preparer();

    await creerPremierAdministrateur.execute(commande());

    expect(hacheur.motsDePasseRecus).toHaveLength(1);
    expect(hacheur.hacheDansUneTransaction).toBe(false);
  });

  it('refuse dès qu’un administrateur existe, sans hacher ni écrire (AUTH_BOOTSTRAP_DISABLED)', async () => {
    preparer([unAdministrateurExistant()]);

    const erreur = await creerPremierAdministrateur
      .execute(commande())
      .catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(AdministrateurDejaExistant);
    expect(erreur).toMatchObject({ code: 'AUTH_BOOTSTRAP_DISABLED' });
    // Un hachage lent n'est jamais dépensé pour une demande refusée.
    expect(hacheur.motsDePasseRecus).toEqual([]);
    expect(unitOfWork.nombreDeCommits).toBe(0);
    expect(await utilisateurRepository.get(idGenere)).toBeNull();
  });

  it('refuse si un administrateur est apparu pendant le hachage : revérifié dans la transaction', async () => {
    preparer();
    // Une autre demande crée l'administrateur pendant que celle-ci hache.
    hacheur.pendantLeHachage(() =>
      utilisateurRepository.save(unAdministrateurExistant()),
    );

    await expect(
      creerPremierAdministrateur.execute(commande()),
    ).rejects.toBeInstanceOf(AdministrateurDejaExistant);
    expect(unitOfWork.nombreDeCommits).toBe(0);
    expect(await utilisateurRepository.get(idGenere)).toBeNull();
  });

  it('laisse passer le refus du stockage quand deux premiers administrateurs se croisent', async () => {
    // Deux demandes simultanées voient « aucun admin » : la contrainte du
    // stockage tranche, et son refus remonte tel quel, sans commit.
    class StockageQuiRefuseLeSecond extends UtilisateurRepositoryEnMemoire {
      override async existsAdministrateur(): Promise<boolean> {
        return false;
      }

      override async save(): Promise<void> {
        throw new AdministrateurDejaExistant();
      }
    }
    preparer([], new StockageQuiRefuseLeSecond());

    await expect(
      creerPremierAdministrateur.execute(commande()),
    ).rejects.toBeInstanceOf(AdministrateurDejaExistant);
    expect(unitOfWork.nombreDeCommits).toBe(0);
  });

  it('refuse une adresse déjà prise par un compte de centre (AUTH_EMAIL_ALREADY_EXISTS)', async () => {
    preparer([
      Utilisateur.creerCompteCentre(
        {
          id: UtilisateurId.creer('5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c'),
          adresse: AdresseConnexion.creer('ad47.agen@restosducoeur.org'),
          motDePasse: MotDePasseHache.creer('scrypt$sel$empreinte-du-centre'),
          centreId: CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12'),
        },
        maintenant,
      ),
    ]);

    await expect(
      creerPremierAdministrateur.execute(
        commande('ad47.agen@restosducoeur.org'),
      ),
    ).rejects.toBeInstanceOf(AdresseConnexionDejaUtilisee);
    expect(unitOfWork.nombreDeCommits).toBe(0);
  });
});
