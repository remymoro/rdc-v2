import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Email } from '../commun/email';
import { Nom } from '../commun/nom';
import { Telephone } from '../commun/telephone';
import { Ville } from '../commun/ville';
import { Centre } from './centre';
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
});
