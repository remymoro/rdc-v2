import { Centre } from '../centre/centre';
import { CentreId } from '../centre/centre-id';
import { CleDoublonCentre } from '../centre/cle-doublon-centre';
import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Nom } from '../commun/nom';
import { Ville } from '../commun/ville';
import type { CentreRepository } from './centre.repository';

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
  });
}

function unCentre(
  surcharges: Partial<{ nom: string; adresse: string; ville: string }> = {},
): Centre {
  return Centre.creer(
    {
      id: CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12'),
      nom: Nom.creer(surcharges.nom ?? "Centre d'Agen"),
      adresse: Adresse.creer(surcharges.adresse ?? '12 avenue Jean Jaurès'),
      codePostal: CodePostal.creer('47000'),
      ville: Ville.creer(surcharges.ville ?? 'Agen'),
    },
    new Date('2026-10-01T09:00:00.000Z'),
  );
}
