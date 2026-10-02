import { CentreId } from '../centre/centre-id';
import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Email } from '../commun/email';
import { Nom } from '../commun/nom';
import { Telephone } from '../commun/telephone';
import { Ville } from '../commun/ville';
import { CleDoublonMagasin } from '../magasin/cle-doublon-magasin';
import { FichierImage } from '../magasin/image/fichier-image';
import { ImageMagasinId } from '../magasin/image/image-magasin-id';
import { Magasin } from '../magasin/magasin';
import { MagasinId } from '../magasin/magasin-id';
import {
  MagasinDejaExistant,
  type MagasinRepository,
} from './magasin.repository';

export interface ContexteContratMagasinRepository {
  readonly repository: MagasinRepository;
  /** Centre de rattachement déjà enregistré (clé étrangère en base). */
  readonly centreId: CentreId;
  /** Second centre déjà enregistré, pour vérifier qu'on ne mélange pas les centres. */
  readonly autreCentreId: CentreId;
  /** Remet le stockage à zéro après chaque test (base de test, etc.). */
  readonly nettoyer: () => Promise<void>;
}

const ID_MAGASIN = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';
const ID_AUTRE_MAGASIN = '5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c';

/**
 * Suite de contrat du port MagasinRepository (TENETS-TEST-003, ADR-0003 R10).
 * Toute implémentation (en mémoire, Prisma…) doit la passer.
 */
export function verifierContratMagasinRepository(
  implementation: string,
  preparer: () => Promise<ContexteContratMagasinRepository>,
): void {
  describe(`${implementation} respecte le contrat MagasinRepository`, () => {
    let contexte: ContexteContratMagasinRepository;

    beforeEach(async () => {
      contexte = await preparer();
    });

    afterEach(async () => {
      await contexte.nettoyer();
    });

    function magasin(surcharges: Parametres = {}): Magasin {
      return unMagasin(contexte.centreId, surcharges);
    }

    it("ne trouve aucun doublon quand aucun magasin n'est enregistré", async () => {
      const cle = CleDoublonMagasin.depuis(magasin());

      expect(await contexte.repository.existsByCleDoublon(cle)).toBe(false);
    });

    it("trouve le doublon d'un magasin enregistré, même écrit autrement", async () => {
      await contexte.repository.save(magasin());

      const autreEcriture = magasin({
        nom: 'LECLERC AGEN-SUD',
        adresse: '1 Avenue du General de Gaulle',
      });
      const cle = CleDoublonMagasin.depuis(autreEcriture);
      expect(await contexte.repository.existsByCleDoublon(cle)).toBe(true);
    });

    it('ne confond pas deux magasins différents', async () => {
      await contexte.repository.save(magasin());

      const autre = magasin({ adresse: '3 avenue du Général de Gaulle' });
      const cle = CleDoublonMagasin.depuis(autre);
      expect(await contexte.repository.existsByCleDoublon(cle)).toBe(false);
    });

    it('relit un magasin enregistré à l’identique', async () => {
      const enregistre = magasin({
        telephone: '05 53 98 76 54',
        email: 'agen-sud@leclerc.fr',
      });
      await contexte.repository.save(enregistre);

      const relu = await contexte.repository.get(enregistre.id);

      expect(relu).toBeInstanceOf(Magasin);
      expect(relu).toEqual(enregistre);
    });

    it('relit un magasin sans téléphone ni email', async () => {
      const enregistre = magasin();
      await contexte.repository.save(enregistre);

      const relu = await contexte.repository.get(enregistre.id);

      expect(relu?.telephone).toBeUndefined();
      expect(relu?.email).toBeUndefined();
    });

    describe('images (RDC-REF-007)', () => {
      const ajouteeLe = new Date('2026-10-02T09:00:00.000Z');
      const ID_IMAGE_1 = '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d';
      const ID_IMAGE_2 = '1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e';

      function ajouter(cible: Magasin, id: string, extension = 'jpg'): void {
        cible.ajouterImage(
          {
            id: ImageMagasinId.creer(id),
            fichier: FichierImage.creer(`${id}.${extension}`),
          },
          ajouteeLe,
        );
      }

      it('relit les images enregistrées, dans leur ordre', async () => {
        const enregistre = magasin();
        ajouter(enregistre, ID_IMAGE_1, 'png');
        ajouter(enregistre, ID_IMAGE_2);
        await contexte.repository.save(enregistre);

        const relu = await contexte.repository.get(enregistre.id);

        expect(
          relu?.images.map((image) => [
            image.id.valeur,
            image.fichier.valeur,
            image.ordre,
            image.ajouteeLe,
          ]),
        ).toEqual([
          [ID_IMAGE_1, `${ID_IMAGE_1}.png`, 0, ajouteeLe],
          [ID_IMAGE_2, `${ID_IMAGE_2}.jpg`, 1, ajouteeLe],
        ]);
        expect(relu?.images[0]?.id).toBeInstanceOf(ImageMagasinId);
      });

      it('enregistre le retrait d’une image', async () => {
        const enregistre = magasin();
        ajouter(enregistre, ID_IMAGE_1);
        ajouter(enregistre, ID_IMAGE_2);
        await contexte.repository.save(enregistre);

        const relu = await contexte.repository.get(enregistre.id);
        relu?.retirerImage(ImageMagasinId.creer(ID_IMAGE_1), ajouteeLe);
        await contexte.repository.save(relu as Magasin);

        const apresRetrait = await contexte.repository.get(enregistre.id);
        expect(apresRetrait?.images.map((image) => image.id.valeur)).toEqual([
          ID_IMAGE_2,
        ]);
      });

      it('ne voit pas une image ajoutée sans save()', async () => {
        const enregistre = magasin();
        await contexte.repository.save(enregistre);

        const relu = await contexte.repository.get(enregistre.id);
        if (relu) ajouter(relu, ID_IMAGE_1);

        expect((await contexte.repository.get(enregistre.id))?.images).toEqual(
          [],
        );
      });
    });

    it('renvoie null pour un identifiant inconnu', async () => {
      await contexte.repository.save(magasin());

      const inconnu = MagasinId.creer(ID_AUTRE_MAGASIN);
      expect(await contexte.repository.get(inconnu)).toBeNull();
    });

    describe('existsNonArchiveDuCentre (RDC-REF-011)', () => {
      it("répond non quand le centre n'a aucun magasin", async () => {
        expect(
          await contexte.repository.existsNonArchiveDuCentre(contexte.centreId),
        ).toBe(false);
      });

      it('répond oui pour un magasin actif du centre', async () => {
        await contexte.repository.save(magasin());

        expect(
          await contexte.repository.existsNonArchiveDuCentre(contexte.centreId),
        ).toBe(true);
      });

      it('répond oui pour un magasin inactif du centre', async () => {
        const inactif = magasin();
        inactif.desactiver(new Date('2026-10-02T09:00:00.000Z'));
        await contexte.repository.save(inactif);

        expect(
          await contexte.repository.existsNonArchiveDuCentre(contexte.centreId),
        ).toBe(true);
      });

      it('ne compte pas un magasin archivé', async () => {
        const archive = magasin();
        archive.archiver(new Date('2026-10-02T09:00:00.000Z'));
        await contexte.repository.save(archive);

        expect(
          await contexte.repository.existsNonArchiveDuCentre(contexte.centreId),
        ).toBe(false);
      });

      it("ne compte pas les magasins d'un autre centre", async () => {
        await contexte.repository.save(unMagasin(contexte.autreCentreId, {}));

        expect(
          await contexte.repository.existsNonArchiveDuCentre(contexte.centreId),
        ).toBe(false);
      });
    });

    it('refuse un second magasin de même clé de doublon (MagasinDejaExistant)', async () => {
      await contexte.repository.save(magasin());

      const doublon = magasin({
        id: ID_AUTRE_MAGASIN,
        nom: 'LECLERC AGEN SUD',
      });
      await expect(contexte.repository.save(doublon)).rejects.toBeInstanceOf(
        MagasinDejaExistant,
      );
      expect(await contexte.repository.get(doublon.id)).toBeNull();
    });
  });
}

type Parametres = Partial<{
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
}>;

function unMagasin(centreId: CentreId, surcharges: Parametres): Magasin {
  return Magasin.creer(
    {
      id: MagasinId.creer(surcharges.id ?? ID_MAGASIN),
      nom: Nom.creer(surcharges.nom ?? 'Leclerc Agen Sud'),
      adresse: Adresse.creer(
        surcharges.adresse ?? '1 avenue du Général de Gaulle',
      ),
      codePostal: CodePostal.creer('47000'),
      ville: Ville.creer('Agen'),
      centreId,
      ...(surcharges.telephone && {
        telephone: Telephone.creer(surcharges.telephone),
      }),
      ...(surcharges.email && { email: Email.creer(surcharges.email) }),
    },
    new Date('2026-10-01T09:00:00.000Z'),
  );
}
