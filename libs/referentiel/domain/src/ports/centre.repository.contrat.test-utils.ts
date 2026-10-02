import { Centre } from '../centre/centre';
import { CentreId } from '../centre/centre-id';
import { CleDoublonCentre } from '../centre/cle-doublon-centre';
import { StatutCentre } from '../centre/statut-centre';
import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Email } from '../commun/email';
import { Nom } from '../commun/nom';
import { Telephone } from '../commun/telephone';
import { Ville } from '../commun/ville';
import { CentreDejaExistant, type CentreRepository } from './centre.repository';

export interface ContexteContratCentreRepository {
  readonly repository: CentreRepository;
  /** Remet le stockage à zéro après chaque test (base de test, etc.). */
  readonly nettoyer: () => Promise<void>;
}

/**
 * Suite de contrat du port CentreRepository (TENETS-TEST-003, ADR-0003 R10).
 * Toute implémentation (en mémoire, Prisma…) doit la passer. Elle ne teste
 * que ce que promet le port, rien de propre à une technologie.
 */
export function verifierContratCentreRepository(
  implementation: string,
  preparer: () => Promise<ContexteContratCentreRepository>,
): void {
  describe(`${implementation} respecte le contrat CentreRepository`, () => {
    let contexte: ContexteContratCentreRepository;

    beforeEach(async () => {
      contexte = await preparer();
    });

    afterEach(async () => {
      await contexte.nettoyer();
    });

    it("ne trouve aucun doublon quand aucun centre n'est enregistré", async () => {
      const cle = CleDoublonCentre.depuis(unCentre());

      expect(await contexte.repository.existsByCleDoublon(cle)).toBe(false);
    });

    it("trouve le doublon d'un centre enregistré", async () => {
      const centre = unCentre();
      await contexte.repository.save(centre);

      const cle = CleDoublonCentre.depuis(centre);
      expect(await contexte.repository.existsByCleDoublon(cle)).toBe(true);
    });

    it('trouve le doublon même quand il est écrit autrement', async () => {
      await contexte.repository.save(unCentre());

      const autreEcriture = unCentre({
        nom: "CENTRE-D'AGEN",
        adresse: '12 Avenue Jean-Jaures',
        ville: 'AGEN',
      });
      const cle = CleDoublonCentre.depuis(autreEcriture);
      expect(await contexte.repository.existsByCleDoublon(cle)).toBe(true);
    });

    it('ne confond pas deux centres différents', async () => {
      await contexte.repository.save(unCentre());

      const autreCentre = unCentre({ adresse: '14 avenue Jean Jaurès' });
      const cle = CleDoublonCentre.depuis(autreCentre);
      expect(await contexte.repository.existsByCleDoublon(cle)).toBe(false);
    });

    it('relit un centre enregistré à l’identique', async () => {
      const centre = unCentre({
        telephone: '05 53 00 00 00',
        email: 'agen@restosducoeur.org',
      });
      await contexte.repository.save(centre);

      const relu = await contexte.repository.get(centre.id);

      expect(relu).toBeInstanceOf(Centre);
      expect(relu).toEqual(centre);
    });

    it('relit un centre sans téléphone ni email', async () => {
      const centre = unCentre();
      await contexte.repository.save(centre);

      const relu = await contexte.repository.get(centre.id);

      expect(relu?.telephone).toBeUndefined();
      expect(relu?.email).toBeUndefined();
    });

    it('renvoie null pour un identifiant inconnu', async () => {
      await contexte.repository.save(unCentre());

      const inconnu = CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b');
      expect(await contexte.repository.get(inconnu)).toBeNull();
    });

    it('relit un centre modifié puis réenregistré avec son nouvel état', async () => {
      const centre = unCentre();
      await contexte.repository.save(centre);

      centre.desactiver(new Date('2026-10-02T14:30:00.000Z'));
      await contexte.repository.save(centre);

      const relu = await contexte.repository.get(centre.id);
      expect(relu?.statut).toBe(StatutCentre.INACTIF);
      expect(relu?.creeLe).toEqual(new Date('2026-10-01T09:00:00.000Z'));
      expect(relu?.modifieLe).toEqual(new Date('2026-10-02T14:30:00.000Z'));
    });

    it('refuse un second centre de même clé de doublon (CentreDejaExistant)', async () => {
      await contexte.repository.save(unCentre());

      const doublon = unCentre({
        id: '1c7f4a8b-0d3e-4f2a-9b6c-7d8e9f0a1b2c',
        nom: "CENTRE-D'AGEN",
      });
      await expect(contexte.repository.save(doublon)).rejects.toBeInstanceOf(
        CentreDejaExistant,
      );
      expect(await contexte.repository.get(doublon.id)).toBeNull();
    });

    it('ne voit pas une modification qui n’a pas été enregistrée', async () => {
      const centre = unCentre();
      await contexte.repository.save(centre);

      centre.archiver(new Date('2026-10-02T14:30:00.000Z'));

      const relu = await contexte.repository.get(centre.id);
      expect(relu?.statut).toBe(StatutCentre.ACTIF);
    });
  });
}

function unCentre(
  surcharges: Partial<{
    id: string;
    nom: string;
    adresse: string;
    ville: string;
    telephone: string;
    email: string;
  }> = {},
): Centre {
  return Centre.creer(
    {
      id: CentreId.creer(
        surcharges.id ?? '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
      ),
      nom: Nom.creer(surcharges.nom ?? "Centre d'Agen"),
      adresse: Adresse.creer(surcharges.adresse ?? '12 avenue Jean Jaurès'),
      codePostal: CodePostal.creer('47000'),
      ville: Ville.creer(surcharges.ville ?? 'Agen'),
      ...(surcharges.telephone && {
        telephone: Telephone.creer(surcharges.telephone),
      }),
      ...(surcharges.email && { email: Email.creer(surcharges.email) }),
    },
    new Date('2026-10-01T09:00:00.000Z'),
  );
}
