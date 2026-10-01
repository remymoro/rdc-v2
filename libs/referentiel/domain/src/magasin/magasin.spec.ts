import { CentreId } from '../centre/centre-id';
import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Email } from '../commun/email';
import { Nom } from '../commun/nom';
import { Telephone } from '../commun/telephone';
import { Ville } from '../commun/ville';
import { Magasin } from './magasin';
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
});
