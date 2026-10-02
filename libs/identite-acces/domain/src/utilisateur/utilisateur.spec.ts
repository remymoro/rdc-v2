import { AdresseConnexion } from './adresse-connexion';
import { CentreId, UtilisateurId } from './identifiants';
import { MotDePasseHache } from './mot-de-passe';
import { Role } from './role';
import { type EtatUtilisateur, Utilisateur } from './utilisateur';
import {
  AdministrateurNonDesactivable,
  AdministrateurRattacheAUnCentre,
  CompteCentreSansCentre,
} from './utilisateur.errors';

describe('Utilisateur', () => {
  const creation = new Date('2026-10-02T08:00:00.000Z');
  const plusTard = new Date('2026-10-03T09:30:00.000Z');
  const id = UtilisateurId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');
  const autreCentre = CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b');
  const adresse = AdresseConnexion.creer('ad47.agen@restosducoeur.org');
  const motDePasse = MotDePasseHache.creer('empreinte-initiale');

  function unCompteCentre(): Utilisateur {
    return Utilisateur.creerCompteCentre(
      { id, adresse, motDePasse, centreId },
      creation,
    );
  }

  function unAdministrateur(): Utilisateur {
    return Utilisateur.creerAdministrateur(
      {
        id,
        adresse: AdresseConnexion.creer('siege@ad47.org'),
        motDePasse,
      },
      creation,
    );
  }

  /** État persisté d'un compte de centre, à modifier par test. */
  function etatCompteCentre(
    changements: Partial<EtatUtilisateur> = {},
  ): EtatUtilisateur {
    return {
      id,
      role: Role.RESPONSABLE_CENTRE,
      adresse,
      motDePasse,
      centreId,
      actif: true,
      creeLe: creation,
      modifieLe: creation,
      ...changements,
    };
  }

  describe('création', () => {
    it('crée le compte d’un centre, actif, rattaché à son centre', () => {
      const compte = unCompteCentre();

      expect(compte.id.equals(id)).toBe(true);
      expect(compte.role).toBe(Role.RESPONSABLE_CENTRE);
      expect(compte.adresse.equals(adresse)).toBe(true);
      expect(compte.motDePasse).toBe(motDePasse);
      expect(compte.centreId?.equals(centreId)).toBe(true);
      expect(compte.estActif).toBe(true);
      expect(compte.creeLe).toEqual(creation);
      expect(compte.modifieLe).toEqual(creation);
    });

    it('crée l’administrateur, actif, sans centre', () => {
      const administrateur = unAdministrateur();

      expect(administrateur.role).toBe(Role.ADMIN);
      expect(administrateur.centreId).toBeNull();
      expect(administrateur.estActif).toBe(true);
    });
  });

  describe('périmètre : un responsable ne voit que son centre (RDC-ACCES-002)', () => {
    it('donne au compte d’un centre l’accès à son centre seulement', () => {
      const compte = unCompteCentre();

      expect(compte.aAccesAuCentre(centreId)).toBe(true);
      expect(compte.aAccesAuCentre(autreCentre)).toBe(false);
    });

    it('donne à l’administrateur l’accès à tous les centres', () => {
      expect(unAdministrateur().aAccesAuCentre(autreCentre)).toBe(true);
    });
  });

  describe('mot de passe (RDC-ACCES-009)', () => {
    it('remplace l’empreinte et date la modification', () => {
      const compte = unCompteCentre();
      const nouveau = MotDePasseHache.creer('nouvelle-empreinte');

      compte.changerMotDePasse(nouveau, plusTard);

      expect(compte.motDePasse).toBe(nouveau);
      expect(compte.modifieLe).toEqual(plusTard);
    });
  });

  describe('adresse de connexion', () => {
    it('change l’adresse et date la modification', () => {
      const compte = unCompteCentre();
      const nouvelle = AdresseConnexion.creer('collecte.agen@ad47.org');

      compte.changerAdresse(nouvelle, plusTard);

      expect(compte.adresse.equals(nouvelle)).toBe(true);
      expect(compte.modifieLe).toEqual(plusTard);
    });

    it('ne date pas la modification si l’adresse ne change pas', () => {
      const compte = unCompteCentre();

      compte.changerAdresse(AdresseConnexion.creer(adresse.valeur), plusTard);

      expect(compte.modifieLe).toEqual(creation);
    });
  });

  describe('désactiver et activer un compte', () => {
    it('désactive un compte actif et date la modification', () => {
      const compte = unCompteCentre();

      compte.desactiver(plusTard);

      expect(compte.estActif).toBe(false);
      expect(compte.modifieLe).toEqual(plusTard);
    });

    it('désactiver un compte déjà inactif est sans effet', () => {
      const compte = Utilisateur.reconstituer(
        etatCompteCentre({ actif: false }),
      );

      compte.desactiver(plusTard);

      expect(compte.modifieLe).toEqual(creation);
    });

    it('réactive un compte inactif et date la modification', () => {
      const compte = Utilisateur.reconstituer(
        etatCompteCentre({ actif: false }),
      );

      compte.activer(plusTard);

      expect(compte.estActif).toBe(true);
      expect(compte.modifieLe).toEqual(plusTard);
    });

    it('activer un compte déjà actif est sans effet', () => {
      const compte = unCompteCentre();

      compte.activer(plusTard);

      expect(compte.modifieLe).toEqual(creation);
    });

    it('refuse de désactiver l’administrateur unique : personne ne pourrait plus administrer (ADMIN_NON_DESACTIVABLE)', () => {
      const administrateur = unAdministrateur();

      expect(() => administrateur.desactiver(plusTard)).toThrow(
        AdministrateurNonDesactivable,
      );
      expect(() => administrateur.desactiver(plusTard)).toThrow(
        expect.objectContaining({ code: 'ADMIN_NON_DESACTIVABLE' }),
      );
      expect(administrateur.estActif).toBe(true);
    });
  });

  describe('reconstitution (RDC-ACCES-001)', () => {
    it('reconstitue l’état persisté tel quel', () => {
      const compte = Utilisateur.reconstituer(
        etatCompteCentre({ actif: false, modifieLe: plusTard }),
      );

      expect(compte.estActif).toBe(false);
      expect(compte.modifieLe).toEqual(plusTard);
      expect(compte.centreId?.equals(centreId)).toBe(true);
    });

    it('refuse un compte de centre sans centre (USER_CENTRE_REQUIRED, code v1)', () => {
      expect(() =>
        Utilisateur.reconstituer(etatCompteCentre({ centreId: null })),
      ).toThrow(CompteCentreSansCentre);
      expect(() =>
        Utilisateur.reconstituer(etatCompteCentre({ centreId: null })),
      ).toThrow(expect.objectContaining({ code: 'USER_CENTRE_REQUIRED' }));
    });

    it('refuse un administrateur rattaché à un centre (ADMIN_CENTRE_INTERDIT)', () => {
      expect(() =>
        Utilisateur.reconstituer(etatCompteCentre({ role: Role.ADMIN })),
      ).toThrow(AdministrateurRattacheAUnCentre);
    });
  });

  it('compare deux utilisateurs par leur identité', () => {
    const compte = unCompteCentre();
    const memeCompteModifie = Utilisateur.reconstituer(
      etatCompteCentre({ actif: false }),
    );

    expect(compte.equals(memeCompteModifie)).toBe(true);
  });
});
