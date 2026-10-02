import { AdresseConnexion } from '../utilisateur/adresse-connexion';
import { CentreId, UtilisateurId } from '../utilisateur/identifiants';
import { MotDePasseHache } from '../utilisateur/mot-de-passe';
import { Role } from '../utilisateur/role';
import { Utilisateur } from '../utilisateur/utilisateur';
import {
  AdministrateurDejaExistant,
  AdresseConnexionDejaUtilisee,
  type UtilisateurRepository,
} from './utilisateur.repository';

export interface ContexteContratUtilisateurRepository {
  readonly repository: UtilisateurRepository;
  /** Centre existant que les comptes de centre peuvent référencer. */
  readonly centreId: CentreId;
  /** Remet le stockage à zéro après chaque test (base de test, etc.). */
  readonly nettoyer: () => Promise<void>;
}

const creation = new Date('2026-10-02T08:00:00.000Z');
const plusTard = new Date('2026-10-03T09:30:00.000Z');
const empreinte = MotDePasseHache.creer('scrypt$sel$empreinte-du-contrat');

function id(valeur: string): UtilisateurId {
  return UtilisateurId.creer(valeur);
}

function unAdministrateur(
  identifiant = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b',
  adresse = 'siege@ad47.org',
): Utilisateur {
  return Utilisateur.creerAdministrateur(
    {
      id: id(identifiant),
      adresse: AdresseConnexion.creer(adresse),
      motDePasse: empreinte,
    },
    creation,
  );
}

function unCompteCentre(
  centreId: CentreId,
  identifiant = '5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c',
  adresse = 'ad47.agen@restosducoeur.org',
): Utilisateur {
  return Utilisateur.creerCompteCentre(
    {
      id: id(identifiant),
      adresse: AdresseConnexion.creer(adresse),
      motDePasse: empreinte,
      centreId,
    },
    creation,
  );
}

/**
 * Suite de contrat du port UtilisateurRepository (TENETS-TEST-003, ADR-0003
 * R10). Toute implémentation (en mémoire, Prisma…) doit la passer.
 */
export function verifierContratUtilisateurRepository(
  implementation: string,
  preparer: () => Promise<ContexteContratUtilisateurRepository>,
): void {
  describe(`${implementation} respecte le contrat UtilisateurRepository`, () => {
    let contexte: ContexteContratUtilisateurRepository;

    beforeEach(async () => {
      contexte = await preparer();
    });

    afterEach(async () => {
      await contexte.nettoyer();
    });

    it('renvoie null pour un utilisateur absent', async () => {
      expect(
        await contexte.repository.get(
          id('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b'),
        ),
      ).toBeNull();
      expect(
        await contexte.repository.getByAdresse(
          AdresseConnexion.creer('inconnu@ad47.org'),
        ),
      ).toBeNull();
    });

    it('enregistre puis relit un compte de centre complet', async () => {
      const compte = unCompteCentre(contexte.centreId);
      await contexte.repository.save(compte);

      const relu = await contexte.repository.get(compte.id);

      expect(relu?.id.equals(compte.id)).toBe(true);
      expect(relu?.role).toBe(Role.RESPONSABLE_CENTRE);
      expect(relu?.adresse.equals(compte.adresse)).toBe(true);
      expect(relu?.motDePasse.valeur).toBe(empreinte.valeur);
      expect(relu?.centreId?.equals(contexte.centreId)).toBe(true);
      expect(relu?.estActif).toBe(true);
      expect(relu?.creeLe).toEqual(creation);
      expect(relu?.modifieLe).toEqual(creation);
    });

    it('enregistre puis relit l’administrateur, sans centre', async () => {
      const administrateur = unAdministrateur();
      await contexte.repository.save(administrateur);

      const relu = await contexte.repository.get(administrateur.id);

      expect(relu?.role).toBe(Role.ADMIN);
      expect(relu?.centreId).toBeNull();
    });

    it('retrouve un utilisateur par son adresse de connexion', async () => {
      const compte = unCompteCentre(contexte.centreId);
      await contexte.repository.save(compte);

      const trouve = await contexte.repository.getByAdresse(
        AdresseConnexion.creer('AD47.Agen@RestosDuCoeur.org'),
      );

      expect(trouve?.id.equals(compte.id)).toBe(true);
    });

    it('enregistre les modifications d’un utilisateur existant', async () => {
      const compte = unCompteCentre(contexte.centreId);
      await contexte.repository.save(compte);

      compte.desactiver(plusTard);
      compte.changerMotDePasse(
        MotDePasseHache.creer('scrypt$sel$nouvelle-empreinte'),
        plusTard,
      );
      await contexte.repository.save(compte);

      const relu = await contexte.repository.get(compte.id);
      expect(relu?.estActif).toBe(false);
      expect(relu?.motDePasse.valeur).toBe('scrypt$sel$nouvelle-empreinte');
      expect(relu?.modifieLe).toEqual(plusTard);
    });

    it('sait si un administrateur existe (RDC-ACCES-004)', async () => {
      expect(await contexte.repository.existsAdministrateur()).toBe(false);

      await contexte.repository.save(unCompteCentre(contexte.centreId));
      expect(await contexte.repository.existsAdministrateur()).toBe(false);

      await contexte.repository.save(unAdministrateur());
      expect(await contexte.repository.existsAdministrateur()).toBe(true);
    });

    it('refuse un second administrateur (AUTH_BOOTSTRAP_DISABLED, RDC-ACCES-011)', async () => {
      await contexte.repository.save(unAdministrateur());

      await expect(
        contexte.repository.save(
          unAdministrateur(
            '0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b',
            'autre@ad47.org',
          ),
        ),
      ).rejects.toBeInstanceOf(AdministrateurDejaExistant);
      expect(
        await contexte.repository.get(
          id('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b'),
        ),
      ).toBeNull();
    });

    it('enregistre les modifications de l’administrateur sans le prendre pour un second', async () => {
      const administrateur = unAdministrateur();
      await contexte.repository.save(administrateur);

      administrateur.changerMotDePasse(
        MotDePasseHache.creer('scrypt$sel$empreinte-de-secours'),
        plusTard,
      );
      await contexte.repository.save(administrateur);

      const relu = await contexte.repository.get(administrateur.id);
      expect(relu?.motDePasse.valeur).toBe('scrypt$sel$empreinte-de-secours');
      expect(await contexte.repository.existsAdministrateur()).toBe(true);
    });

    it('ne voit pas une modification qui n’a pas été enregistrée', async () => {
      const compte = unCompteCentre(contexte.centreId);
      await contexte.repository.save(compte);

      compte.desactiver(plusTard);

      expect((await contexte.repository.get(compte.id))?.estActif).toBe(true);
    });

    it('retrouve un utilisateur par sa nouvelle adresse après un changement, plus par l’ancienne', async () => {
      const compte = unCompteCentre(contexte.centreId);
      await contexte.repository.save(compte);

      compte.changerAdresse(
        AdresseConnexion.creer('collecte.agen@ad47.org'),
        plusTard,
      );
      await contexte.repository.save(compte);

      expect(
        (
          await contexte.repository.getByAdresse(
            AdresseConnexion.creer('collecte.agen@ad47.org'),
          )
        )?.id.equals(compte.id),
      ).toBe(true);
      expect(
        await contexte.repository.getByAdresse(
          AdresseConnexion.creer('ad47.agen@restosducoeur.org'),
        ),
      ).toBeNull();
    });

    it('refuse de changer l’adresse pour celle d’un autre utilisateur (AUTH_EMAIL_ALREADY_EXISTS)', async () => {
      const administrateur = unAdministrateur();
      const compte = unCompteCentre(contexte.centreId);
      await contexte.repository.save(administrateur);
      await contexte.repository.save(compte);

      compte.changerAdresse(administrateur.adresse, plusTard);

      await expect(contexte.repository.save(compte)).rejects.toBeInstanceOf(
        AdresseConnexionDejaUtilisee,
      );
      expect((await contexte.repository.get(compte.id))?.adresse.valeur).toBe(
        'ad47.agen@restosducoeur.org',
      );
    });

    it('refuse une adresse déjà utilisée par un autre utilisateur (AUTH_EMAIL_ALREADY_EXISTS, RDC-ACCES-010)', async () => {
      await contexte.repository.save(unCompteCentre(contexte.centreId));

      await expect(
        contexte.repository.save(
          unAdministrateur(
            '0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b',
            'ad47.agen@restosducoeur.org',
          ),
        ),
      ).rejects.toBeInstanceOf(AdresseConnexionDejaUtilisee);
      expect(await contexte.repository.existsAdministrateur()).toBe(false);
    });
  });
}
