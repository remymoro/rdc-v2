import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Email } from '../commun/email';
import { Nom } from '../commun/nom';
import { Telephone } from '../commun/telephone';
import { Ville } from '../commun/ville';
import { Centre } from './centre';
import { CentreArchive, CentreNonActif } from './centre.errors';
import { CentreId } from './centre-id';
import { StatutCentre } from './statut-centre';

describe('Centre', () => {
  const maintenant = new Date('2026-10-01T09:00:00.000Z');
  const id = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');

  /** Données obligatoires d'un nouveau centre valide. */
  function donneesObligatoires() {
    return {
      id,
      nom: Nom.creer("Centre d'Agen"),
      adresse: Adresse.creer('12 avenue Jean Jaurès'),
      codePostal: CodePostal.creer('47000'),
      ville: Ville.creer('Agen'),
    };
  }

  describe('creer', () => {
    it("crée un centre ACTIF, avec l'identifiant reçu et ses dates de création", () => {
      const centre = Centre.creer(donneesObligatoires(), maintenant);

      expect(centre.id.equals(id)).toBe(true);
      expect(centre.nom.valeur).toBe("Centre d'Agen");
      expect(centre.statut).toBe(StatutCentre.ACTIF);
      expect(centre.creeLe).toEqual(maintenant);
      expect(centre.modifieLe).toEqual(maintenant);
    });

    it('crée un centre avec son adresse complète et ses contacts', () => {
      const centre = Centre.creer(
        {
          ...donneesObligatoires(),
          telephone: Telephone.creer('05 53 12 34 56'),
          email: Email.creer('agen@restosducoeur.org'),
        },
        maintenant,
      );

      expect(centre.adresse.valeur).toBe('12 avenue Jean Jaurès');
      expect(centre.codePostal.valeur).toBe('47000');
      expect(centre.ville.valeur).toBe('Agen');
      expect(centre.telephone?.valeur).toBe('+33553123456');
      expect(centre.email?.valeur).toBe('agen@restosducoeur.org');
    });

    it('crée un centre sans téléphone ni email', () => {
      const centre = Centre.creer(donneesObligatoires(), maintenant);

      expect(centre.telephone).toBeUndefined();
      expect(centre.email).toBeUndefined();
    });
  });

  describe('reconstituer', () => {
    it("restitue l'état persisté tel quel, sans valeur par défaut", () => {
      const creeLe = new Date('2024-03-01T08:00:00.000Z');
      const modifieLe = new Date('2025-06-15T14:30:00.000Z');

      const centre = Centre.reconstituer({
        ...donneesObligatoires(),
        telephone: Telephone.creer('05 53 12 34 56'),
        statut: StatutCentre.ARCHIVE,
        creeLe,
        modifieLe,
      });

      expect(centre.id.equals(id)).toBe(true);
      expect(centre.statut).toBe(StatutCentre.ARCHIVE);
      expect(centre.creeLe).toEqual(creeLe);
      expect(centre.modifieLe).toEqual(modifieLe);
      expect(centre.telephone?.valeur).toBe('+33553123456');
      expect(centre.email).toBeUndefined();
    });
  });

  describe('cycle de vie', () => {
    const plusTard = new Date('2026-11-15T10:00:00.000Z');

    describe('desactiver', () => {
      it('passe un centre actif à INACTIF et date la modification', () => {
        const centre = Centre.creer(donneesObligatoires(), maintenant);

        centre.desactiver(plusTard);

        expect(centre.statut).toBe(StatutCentre.INACTIF);
        expect(centre.modifieLe).toEqual(plusTard);
        expect(centre.creeLe).toEqual(maintenant);
      });

      it('est sans effet pour un centre déjà inactif', () => {
        const premiereDesactivation = new Date('2026-10-20T14:00:00.000Z');
        const centre = Centre.reconstituer({
          ...donneesObligatoires(),
          statut: StatutCentre.INACTIF,
          creeLe: maintenant,
          modifieLe: premiereDesactivation,
        });

        centre.desactiver(plusTard);

        expect(centre.statut).toBe(StatutCentre.INACTIF);
        expect(centre.modifieLe).toEqual(premiereDesactivation);
      });
    });

    describe('activer', () => {
      it('repasse un centre inactif à ACTIF et date la modification', () => {
        const desactiveLe = new Date('2026-10-20T14:00:00.000Z');
        const centre = Centre.reconstituer({
          ...donneesObligatoires(),
          statut: StatutCentre.INACTIF,
          creeLe: maintenant,
          modifieLe: desactiveLe,
        });

        centre.activer(plusTard);

        expect(centre.statut).toBe(StatutCentre.ACTIF);
        expect(centre.modifieLe).toEqual(plusTard);
      });

      it('est sans effet pour un centre déjà actif', () => {
        const derniereActivation = new Date('2026-10-20T14:00:00.000Z');
        const centre = Centre.reconstituer({
          ...donneesObligatoires(),
          statut: StatutCentre.ACTIF,
          creeLe: maintenant,
          modifieLe: derniereActivation,
        });

        centre.activer(plusTard);

        expect(centre.statut).toBe(StatutCentre.ACTIF);
        expect(centre.modifieLe).toEqual(derniereActivation);
      });
    });

    describe('archiver', () => {
      it('passe un centre actif à ARCHIVE et date la modification', () => {
        const centre = Centre.creer(donneesObligatoires(), maintenant);

        centre.archiver(plusTard);

        expect(centre.statut).toBe(StatutCentre.ARCHIVE);
        expect(centre.modifieLe).toEqual(plusTard);
        expect(centre.creeLe).toEqual(maintenant);
      });

      it('passe un centre inactif à ARCHIVE et date la modification', () => {
        const desactiveLe = new Date('2026-10-20T14:00:00.000Z');
        const centre = Centre.reconstituer({
          ...donneesObligatoires(),
          statut: StatutCentre.INACTIF,
          creeLe: maintenant,
          modifieLe: desactiveLe,
        });

        centre.archiver(plusTard);

        expect(centre.statut).toBe(StatutCentre.ARCHIVE);
        expect(centre.modifieLe).toEqual(plusTard);
      });

      it('est sans effet pour un centre déjà archivé', () => {
        const archiveLe = new Date('2026-10-20T14:00:00.000Z');
        const centre = Centre.reconstituer({
          ...donneesObligatoires(),
          statut: StatutCentre.ARCHIVE,
          creeLe: maintenant,
          modifieLe: archiveLe,
        });

        centre.archiver(plusTard);

        expect(centre.statut).toBe(StatutCentre.ARCHIVE);
        expect(centre.modifieLe).toEqual(archiveLe);
      });
    });

    describe('centre archivé', () => {
      it.each([
        {
          action: "l'activer",
          executer: (centre: Centre) => centre.activer(plusTard),
        },
        {
          action: 'le désactiver',
          executer: (centre: Centre) => centre.desactiver(plusTard),
        },
      ])('refuse de $action avec CENTRE_ARCHIVED', ({ executer }) => {
        const archiveLe = new Date('2026-10-20T14:00:00.000Z');
        const centre = Centre.reconstituer({
          ...donneesObligatoires(),
          statut: StatutCentre.ARCHIVE,
          creeLe: maintenant,
          modifieLe: archiveLe,
        });

        let erreur: unknown;
        try {
          executer(centre);
        } catch (cause) {
          erreur = cause;
        }

        expect(erreur).toBeInstanceOf(CentreArchive);
        expect(erreur).toMatchObject({ code: 'CENTRE_ARCHIVED', centreId: id });
        // Message affiché tel quel par le front : lisible, sans identifiant technique.
        expect(erreur).toMatchObject({
          message: 'Ce centre est archivé : il ne peut plus être modifié.',
        });
        expect(centre.statut).toBe(StatutCentre.ARCHIVE);
        expect(centre.modifieLe).toEqual(archiveLe);
      });
    });
  });

  describe('nouveau rattachement (RDC-REF-010)', () => {
    it('accepte un centre ACTIF', () => {
      const centre = Centre.creer(donneesObligatoires(), maintenant);

      expect(() => centre.verifierOuvertAuxRattachements()).not.toThrow();
    });

    it.each([StatutCentre.INACTIF, StatutCentre.ARCHIVE])(
      'refuse un centre %s avec CENTRE_NON_ACTIF',
      (statut) => {
        const centre = Centre.reconstituer({
          ...donneesObligatoires(),
          statut,
          creeLe: maintenant,
          modifieLe: maintenant,
        });

        expect(() => centre.verifierOuvertAuxRattachements()).toThrow(
          CentreNonActif,
        );
        expect(() => centre.verifierOuvertAuxRattachements()).toThrow(
          expect.objectContaining({ code: 'CENTRE_NON_ACTIF', centreId: id }),
        );
      },
    );
  });

  describe('modifier', () => {
    const plusTard = new Date('2026-10-25T10:00:00.000Z');
    const precedemment = new Date('2026-10-20T14:00:00.000Z');

    function existant(statut = StatutCentre.ACTIF): Centre {
      return Centre.reconstituer({
        ...donneesObligatoires(),
        telephone: Telephone.creer('05 53 12 34 56'),
        email: Email.creer('agen@restosducoeur.org'),
        statut,
        creeLe: maintenant,
        modifieLe: precedemment,
      });
    }

    it('remplace les champs fournis et garde les autres', () => {
      const centre = existant();

      centre.modifier(
        {
          nom: Nom.creer("Centre d'Agen Nord"),
          adresse: Adresse.creer('3 avenue de la Liberté'),
          codePostal: CodePostal.creer('47520'),
          ville: Ville.creer('Le Passage'),
        },
        plusTard,
      );

      expect(centre.nom.valeur).toBe("Centre d'Agen Nord");
      expect(centre.adresse.valeur).toBe('3 avenue de la Liberté');
      expect(centre.codePostal.valeur).toBe('47520');
      expect(centre.ville.valeur).toBe('Le Passage');
      expect(centre.telephone?.valeur).toBe('+33553123456');
      expect(centre.modifieLe).toEqual(plusTard);
    });

    it('remplace ou supprime (null) le téléphone et l’email', () => {
      const centre = existant();

      centre.modifier(
        { telephone: Telephone.creer('05 53 98 76 54'), email: null },
        plusTard,
      );

      expect(centre.telephone?.valeur).toBe('+33553987654');
      expect(centre.email).toBeUndefined();
      expect(centre.modifieLe).toEqual(plusTard);
    });

    it('ne change pas modifieLe pour une modification identique ou vide', () => {
      const centre = existant();

      centre.modifier(
        {
          nom: Nom.creer("Centre d'Agen"),
          telephone: Telephone.creer('05 53 12 34 56'),
        },
        plusTard,
      );
      centre.modifier({}, plusTard);

      expect(centre.modifieLe).toEqual(precedemment);
    });

    it('modifie aussi un centre inactif', () => {
      const centre = existant(StatutCentre.INACTIF);

      centre.modifier({ nom: Nom.creer('Centre de Boé') }, plusTard);

      expect(centre.nom.valeur).toBe('Centre de Boé');
      expect(centre.statut).toBe(StatutCentre.INACTIF);
    });

    it('refuse de modifier un centre archivé (RDC-REF-002)', () => {
      const centre = existant(StatutCentre.ARCHIVE);

      expect(() =>
        centre.modifier({ nom: Nom.creer('Centre de Boé') }, plusTard),
      ).toThrow(CentreArchive);
      expect(centre.nom.valeur).toBe("Centre d'Agen");
    });
  });
});
