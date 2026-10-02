import {
  Adresse,
  CentreId,
  CodePostal,
  Email,
  FichierImage,
  ImageMagasin,
  ImageMagasinId,
  Magasin,
  MagasinId,
  Nom,
  StatutMagasin,
  Telephone,
  Ville,
} from '@rdc/referentiel-domain';
import type { LecturesMagasins } from './lectures-magasins';

export interface ContexteContratLecturesMagasins {
  readonly lectures: LecturesMagasins;
  /** Deux centres déjà enregistrés (clé étrangère en base). */
  readonly centres: readonly [CentreId, CentreId];
  /** Enregistre des magasins à relire (repository, base de test…). */
  readonly enregistrer: (magasins: readonly Magasin[]) => Promise<void>;
  readonly nettoyer: () => Promise<void>;
}

/**
 * Suite de contrat du port de lecture LecturesMagasins (TENETS-TEST-003) :
 * le fake en mémoire et l'adaptateur Prisma doivent la passer.
 */
export function verifierContratLecturesMagasins(
  implementation: string,
  preparer: () => Promise<ContexteContratLecturesMagasins>,
): void {
  describe(`${implementation} respecte le contrat LecturesMagasins`, () => {
    let contexte: ContexteContratLecturesMagasins;

    beforeEach(async () => {
      contexte = await preparer();
    });

    afterEach(async () => {
      await contexte.nettoyer();
    });

    function magasin(
      id: string,
      nom: string,
      centreId: CentreId,
      options: {
        contacts?: boolean;
        statut?: StatutMagasin;
        images?: readonly ImageMagasin[];
      } = {},
    ): Magasin {
      return Magasin.reconstituer({
        id: MagasinId.creer(id),
        nom: Nom.creer(nom),
        adresse: Adresse.creer(`${nom.length} avenue de la Liberté`),
        codePostal: CodePostal.creer('47000'),
        ville: Ville.creer('Agen'),
        centreId,
        ...(options.contacts && {
          telephone: Telephone.creer('05 53 98 76 54'),
          email: Email.creer('contact@magasin.fr'),
        }),
        statut: options.statut ?? StatutMagasin.ACTIF,
        images: options.images ?? [],
        creeLe: new Date('2026-10-01T09:00:00.000Z'),
        modifieLe: new Date('2026-10-02T14:30:00.000Z'),
      });
    }

    const ID_A = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';
    const ID_B = '5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c';
    const ID_C = '6d0c7f80-2b34-4c9d-9e30-9b3e1f904f6d';

    it('liste tous les magasins, triés par nom, archivés compris', async () => {
      const [agen, boe] = contexte.centres;
      await contexte.enregistrer([
        magasin(ID_A, 'Super U Boé', boe),
        magasin(ID_B, 'Carrefour Agen', agen, {
          statut: StatutMagasin.ARCHIVE,
        }),
        magasin(ID_C, 'Leclerc Agen Sud', agen),
      ]);

      const vues = await contexte.lectures.list();

      expect(vues.map((v) => v.nom)).toEqual([
        'Carrefour Agen',
        'Leclerc Agen Sud',
        'Super U Boé',
      ]);
      expect(vues[0]?.statut).toBe(StatutMagasin.ARCHIVE);
    });

    it('liste les magasins d’un seul centre, triés par nom', async () => {
      const [agen, boe] = contexte.centres;
      await contexte.enregistrer([
        magasin(ID_A, 'Super U Boé', boe),
        magasin(ID_B, 'Leclerc Agen Sud', agen),
        magasin(ID_C, 'Carrefour Agen', agen),
      ]);

      const vues = await contexte.lectures.listByCentre(agen);

      expect(vues.map((v) => v.nom)).toEqual([
        'Carrefour Agen',
        'Leclerc Agen Sud',
      ]);
    });

    it('renvoie une liste vide pour un centre sans magasin', async () => {
      const [, boe] = contexte.centres;

      expect(await contexte.lectures.listByCentre(boe)).toEqual([]);
    });

    it('relit tous les champs d’un magasin', async () => {
      const [agen] = contexte.centres;
      await contexte.enregistrer([
        magasin(ID_A, 'Leclerc Agen Sud', agen, { contacts: true }),
      ]);

      const vue = await contexte.lectures.get(MagasinId.creer(ID_A));

      expect(vue).toEqual({
        id: ID_A,
        nom: 'Leclerc Agen Sud',
        adresse: '16 avenue de la Liberté',
        codePostal: '47000',
        ville: 'Agen',
        telephone: '+33553987654',
        email: 'contact@magasin.fr',
        statut: StatutMagasin.ACTIF,
        centreId: agen.valeur,
        images: [],
        creeLe: new Date('2026-10-01T09:00:00.000Z'),
        modifieLe: new Date('2026-10-02T14:30:00.000Z'),
      });
    });

    it('relit les images d’un magasin, dans leur ordre (RDC-REF-007)', async () => {
      const [agen] = contexte.centres;
      const ajouteeLe = new Date('2026-10-02T10:00:00.000Z');
      const image = (id: string, ordre: number) =>
        ImageMagasin.reconstituer({
          id: ImageMagasinId.creer(id),
          fichier: FichierImage.creer(`${id}.png`),
          ordre,
          ajouteeLe,
        });
      await contexte.enregistrer([
        magasin(ID_A, 'Leclerc Agen Sud', agen, {
          images: [image(ID_C, 1), image(ID_B, 0)],
        }),
      ]);

      const vue = await contexte.lectures.get(MagasinId.creer(ID_A));
      const [vueListe] = await contexte.lectures.list();

      const attendues = [
        { id: ID_B, fichier: `${ID_B}.png`, ordre: 0, ajouteeLe },
        { id: ID_C, fichier: `${ID_C}.png`, ordre: 1, ajouteeLe },
      ];
      expect(vue?.images).toEqual(attendues);
      expect(vueListe?.images).toEqual(attendues);
    });

    it('omet téléphone et email absents', async () => {
      const [agen] = contexte.centres;
      await contexte.enregistrer([magasin(ID_A, 'Leclerc Agen Sud', agen)]);

      const vue = await contexte.lectures.get(MagasinId.creer(ID_A));

      expect(vue).not.toHaveProperty('telephone');
      expect(vue).not.toHaveProperty('email');
    });

    it('renvoie null pour un magasin inconnu', async () => {
      expect(await contexte.lectures.get(MagasinId.creer(ID_A))).toBeNull();
    });
  });
}
