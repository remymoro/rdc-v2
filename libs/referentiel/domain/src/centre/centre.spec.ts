import { Nom } from '../commun/nom';
import { Centre } from './centre';
import { CentreId } from './centre-id';
import { StatutCentre } from './statut-centre';

describe('Centre', () => {
  const maintenant = new Date('2026-10-01T09:00:00.000Z');
  const id = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');

  describe('creer', () => {
    it("crée un centre ACTIF, avec l'identifiant reçu et ses dates de création", () => {
      const centre = Centre.creer(
        { id, nom: Nom.creer("Centre d'Agen") },
        maintenant,
      );

      expect(centre.id.equals(id)).toBe(true);
      expect(centre.nom.valeur).toBe("Centre d'Agen");
      expect(centre.statut).toBe(StatutCentre.ACTIF);
      expect(centre.creeLe).toEqual(maintenant);
      expect(centre.modifieLe).toEqual(maintenant);
    });
  });
});
