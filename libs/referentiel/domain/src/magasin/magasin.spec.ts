import { CentreId } from '../centre/centre-id';
import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Email } from '../commun/email';
import { Nom } from '../commun/nom';
import { Telephone } from '../commun/telephone';
import { Ville } from '../commun/ville';
import { Magasin } from './magasin';
import { MagasinArchive } from './magasin.errors';
import { MagasinId } from './magasin-id';
import { StatutMagasin } from './statut-magasin';

describe('Magasin', () => {
  const maintenant = new Date('2026-10-01T09:00:00.000Z');
  const id = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');

  /** Données obligatoires d'un nouveau magasin valide. */
  function donneesObligatoires() {
    return {
      id,
      nom: Nom.creer('Leclerc Agen Sud'),
      adresse: Adresse.creer('1 avenue du Général de Gaulle'),
      codePostal: CodePostal.creer('47000'),
      ville: Ville.creer('Agen'),
      centreId,
    };
  }

  describe('creer', () => {
    it("crée un magasin ACTIF, avec l'identifiant reçu et ses dates de création", () => {
      const magasin = Magasin.creer(donneesObligatoires(), maintenant);

      expect(magasin.id.equals(id)).toBe(true);
      expect(magasin.nom.valeur).toBe('Leclerc Agen Sud');
      expect(magasin.statut).toBe(StatutMagasin.ACTIF);
      expect(magasin.creeLe).toEqual(maintenant);
      expect(magasin.modifieLe).toEqual(maintenant);
    });

    it('rattache le magasin au centre reçu (RDC-REF-005)', () => {
      const magasin = Magasin.creer(donneesObligatoires(), maintenant);

      expect(magasin.centreId.equals(centreId)).toBe(true);
    });

    it('crée un magasin avec son adresse complète et ses contacts', () => {
      const magasin = Magasin.creer(
        {
          ...donneesObligatoires(),
          telephone: Telephone.creer('05 53 98 76 54'),
          email: Email.creer('agen-sud@leclerc.fr'),
        },
        maintenant,
      );

      expect(magasin.adresse.valeur).toBe('1 avenue du Général de Gaulle');
      expect(magasin.codePostal.valeur).toBe('47000');
      expect(magasin.ville.valeur).toBe('Agen');
      expect(magasin.telephone?.valeur).toBe('+33553987654');
      expect(magasin.email?.valeur).toBe('agen-sud@leclerc.fr');
    });

    it('crée un magasin sans téléphone ni email', () => {
      const magasin = Magasin.creer(donneesObligatoires(), maintenant);

      expect(magasin.telephone).toBeUndefined();
      expect(magasin.email).toBeUndefined();
    });
  });

  describe('reconstituer', () => {
    it("restitue l'état persisté tel quel, sans valeur par défaut", () => {
      const creeLe = new Date('2024-03-01T08:00:00.000Z');
      const modifieLe = new Date('2025-06-15T14:30:00.000Z');

      const magasin = Magasin.reconstituer({
        ...donneesObligatoires(),
        telephone: Telephone.creer('05 53 98 76 54'),
        statut: StatutMagasin.ARCHIVE,
        creeLe,
        modifieLe,
      });

      expect(magasin.id.equals(id)).toBe(true);
      expect(magasin.centreId.equals(centreId)).toBe(true);
      expect(magasin.statut).toBe(StatutMagasin.ARCHIVE);
      expect(magasin.creeLe).toEqual(creeLe);
      expect(magasin.modifieLe).toEqual(modifieLe);
      expect(magasin.telephone?.valeur).toBe('+33553987654');
      expect(magasin.email).toBeUndefined();
    });
  });

  describe('cycle de vie (RDC-REF-002)', () => {
    const plusTard = new Date('2026-10-25T10:00:00.000Z');
    const precedemment = new Date('2026-10-20T14:00:00.000Z');

    function existant(statut: StatutMagasin): Magasin {
      return Magasin.reconstituer({
        ...donneesObligatoires(),
        statut,
        creeLe: maintenant,
        modifieLe: precedemment,
      });
    }

    it.each([
      ['desactiver', StatutMagasin.ACTIF, StatutMagasin.INACTIF],
      ['activer', StatutMagasin.INACTIF, StatutMagasin.ACTIF],
      ['archiver', StatutMagasin.ACTIF, StatutMagasin.ARCHIVE],
      ['archiver', StatutMagasin.INACTIF, StatutMagasin.ARCHIVE],
    ] as const)(
      '%s : passe un magasin %s à %s et date la modification',
      (action, depart, arrivee) => {
        const magasin = existant(depart);

        magasin[action](plusTard);

        expect(magasin.statut).toBe(arrivee);
        expect(magasin.modifieLe).toEqual(plusTard);
        expect(magasin.creeLe).toEqual(maintenant);
      },
    );

    it.each([
      ['desactiver', StatutMagasin.INACTIF],
      ['activer', StatutMagasin.ACTIF],
      ['archiver', StatutMagasin.ARCHIVE],
    ] as const)(
      '%s : est sans effet pour un magasin déjà %s',
      (action, statut) => {
        const magasin = existant(statut);

        magasin[action](plusTard);

        expect(magasin.statut).toBe(statut);
        expect(magasin.modifieLe).toEqual(precedemment);
      },
    );

    it.each(['activer', 'desactiver'] as const)(
      '%s : refuse un magasin archivé avec MAGASIN_ARCHIVED',
      (action) => {
        const magasin = existant(StatutMagasin.ARCHIVE);

        let erreur: unknown;
        try {
          magasin[action](plusTard);
        } catch (cause) {
          erreur = cause;
        }

        expect(erreur).toBeInstanceOf(MagasinArchive);
        expect(erreur).toMatchObject({
          code: 'MAGASIN_ARCHIVED',
          magasinId: id,
          message: 'Ce magasin est archivé : il ne peut plus être modifié.',
        });
        expect(magasin.statut).toBe(StatutMagasin.ARCHIVE);
        expect(magasin.modifieLe).toEqual(precedemment);
      },
    );
  });

  describe('modifier et transférer (RDC-REF-005)', () => {
    const plusTard = new Date('2026-10-25T10:00:00.000Z');
    const precedemment = new Date('2026-10-20T14:00:00.000Z');
    const autreCentre = CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b');

    function existant(statut = StatutMagasin.ACTIF): Magasin {
      return Magasin.reconstituer({
        ...donneesObligatoires(),
        telephone: Telephone.creer('05 53 98 76 54'),
        email: Email.creer('agen-sud@leclerc.fr'),
        statut,
        creeLe: maintenant,
        modifieLe: precedemment,
      });
    }

    it('remplace les champs fournis et garde les autres', () => {
      const magasin = existant();

      magasin.modifier(
        {
          nom: Nom.creer('Leclerc Agen Nord'),
          ville: Ville.creer('Le Passage'),
        },
        plusTard,
      );

      expect(magasin.nom.valeur).toBe('Leclerc Agen Nord');
      expect(magasin.ville.valeur).toBe('Le Passage');
      expect(magasin.adresse.valeur).toBe('1 avenue du Général de Gaulle');
      expect(magasin.telephone?.valeur).toBe('+33553987654');
      expect(magasin.modifieLe).toEqual(plusTard);
    });

    it('supprime le téléphone ou l’email reçus à null', () => {
      const magasin = existant();

      magasin.modifier({ telephone: null, email: null }, plusTard);

      expect(magasin.telephone).toBeUndefined();
      expect(magasin.email).toBeUndefined();
      expect(magasin.modifieLe).toEqual(plusTard);
    });

    it('ne change pas modifieLe pour une modification identique', () => {
      const magasin = existant();

      magasin.modifier(
        {
          nom: Nom.creer('Leclerc Agen Sud'),
          telephone: Telephone.creer('05 53 98 76 54'),
        },
        plusTard,
      );
      magasin.modifier({}, plusTard);

      expect(magasin.modifieLe).toEqual(precedemment);
    });

    it('transfère le magasin vers un autre centre et date la modification', () => {
      const magasin = existant();

      magasin.transfererVers(autreCentre, plusTard);

      expect(magasin.centreId.equals(autreCentre)).toBe(true);
      expect(magasin.modifieLe).toEqual(plusTard);
    });

    it('ne change rien pour un transfert vers son propre centre', () => {
      const magasin = existant();

      magasin.transfererVers(centreId, plusTard);

      expect(magasin.centreId.equals(centreId)).toBe(true);
      expect(magasin.modifieLe).toEqual(precedemment);
    });

    it.each([
      [
        'modifier',
        (m: Magasin) => m.modifier({ nom: Nom.creer('Autre') }, plusTard),
      ],
      ['transférer', (m: Magasin) => m.transfererVers(autreCentre, plusTard)],
    ] as const)(
      'refuse de %s un magasin archivé (MAGASIN_ARCHIVED, RDC-REF-002)',
      (_action, executer) => {
        const magasin = existant(StatutMagasin.ARCHIVE);

        expect(() => executer(magasin)).toThrow(MagasinArchive);
        expect(magasin.nom.valeur).toBe('Leclerc Agen Sud');
        expect(magasin.centreId.equals(centreId)).toBe(true);
        expect(magasin.modifieLe).toEqual(precedemment);
      },
    );
  });
});
