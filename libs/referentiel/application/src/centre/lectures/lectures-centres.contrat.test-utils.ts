import {
  Adresse,
  Centre,
  CentreId,
  CodePostal,
  Email,
  Magasin,
  MagasinId,
  Nom,
  StatutCentre,
  StatutMagasin,
  Telephone,
  Ville,
} from '@rdc/referentiel-domain';
import type { LecturesCentres } from './lectures-centres';

export interface ContexteContratLecturesCentres {
  readonly lectures: LecturesCentres;
  /** Enregistre des centres puis leurs magasins (repository, base de test…). */
  readonly enregistrer: (
    centres: readonly Centre[],
    magasins?: readonly Magasin[],
  ) => Promise<void>;
  readonly nettoyer: () => Promise<void>;
}

const ID_AGEN = '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12';
const ID_MARMANDE = '0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b';
const ID_NERAC = '1c7f4a8b-0d3e-4f2a-9b6c-7d8e9f0a1b2c';

/**
 * Suite de contrat du port de lecture LecturesCentres (TENETS-TEST-003) :
 * le fake en mémoire et l'adaptateur Prisma doivent la passer.
 */
export function verifierContratLecturesCentres(
  implementation: string,
  preparer: () => Promise<ContexteContratLecturesCentres>,
): void {
  describe(`${implementation} respecte le contrat LecturesCentres`, () => {
    let contexte: ContexteContratLecturesCentres;

    beforeEach(async () => {
      contexte = await preparer();
    });

    afterEach(async () => {
      await contexte.nettoyer();
    });

    const agen = centre(ID_AGEN, "Centre d'Agen", 'Agen');
    const marmande = centre(ID_MARMANDE, 'Centre de Marmande', 'Marmande', {
      statut: StatutCentre.INACTIF,
    });
    const nerac = centre(ID_NERAC, 'Centre de Nérac', 'Nérac', {
      statut: StatutCentre.ARCHIVE,
    });

    it('liste tous les centres, triés par nom, archivés compris', async () => {
      await contexte.enregistrer([nerac, marmande, agen]);

      const vues = await contexte.lectures.list({});

      expect(vues.map((vue) => vue.nom)).toEqual([
        "Centre d'Agen",
        'Centre de Marmande',
        'Centre de Nérac',
      ]);
    });

    it('projette tous les champs du centre', async () => {
      const avecContacts = centre(ID_AGEN, "Centre d'Agen", 'Agen', {
        contacts: true,
      });
      await contexte.enregistrer([avecContacts]);

      const [vue] = await contexte.lectures.list({});

      expect(vue).toEqual({
        id: ID_AGEN,
        nom: "Centre d'Agen",
        adresse: '12 avenue Jean Jaurès',
        codePostal: '47000',
        ville: 'Agen',
        telephone: '+33553000000',
        email: 'agen@restosducoeur.org',
        statut: StatutCentre.ACTIF,
        magasins: { actifs: 0, inactifs: 0 },
        creeLe: new Date('2026-10-01T09:00:00.000Z'),
        modifieLe: new Date('2026-10-02T14:30:00.000Z'),
      });
    });

    it("n'invente pas de téléphone ni d'email absents", async () => {
      await contexte.enregistrer([agen]);

      const [vue] = await contexte.lectures.list({});

      expect(vue).not.toHaveProperty('telephone');
      expect(vue).not.toHaveProperty('email');
    });

    it('compte les magasins actifs et inactifs du centre, pas les archivés (RDC-REF-011)', async () => {
      await contexte.enregistrer(
        [agen, marmande],
        [
          magasin('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b', 'Leclerc', agen),
          magasin('5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c', 'Carrefour', agen),
          magasin('6d0c7f80-2b34-4c9d-9e30-9b3e1f904f6d', 'Lidl', agen, {
            statut: StatutMagasin.INACTIF,
          }),
          magasin('7e1d8091-3c45-4dae-8f41-0c4f2a015a7e', 'Aldi', agen, {
            statut: StatutMagasin.ARCHIVE,
          }),
          magasin('8f2e91a2-4d56-4ebf-9052-1d5a3b126b8f', 'Super U', marmande),
        ],
      );

      const vues = await contexte.lectures.list({});

      expect(vues.map((vue) => [vue.nom, vue.magasins])).toEqual([
        ["Centre d'Agen", { actifs: 2, inactifs: 1 }],
        ['Centre de Marmande', { actifs: 1, inactifs: 0 }],
      ]);
    });

    it('filtre par statut', async () => {
      await contexte.enregistrer([agen, marmande, nerac]);

      const vues = await contexte.lectures.list({
        statut: StatutCentre.INACTIF,
      });

      expect(vues.map((vue) => vue.id)).toEqual([ID_MARMANDE]);
    });

    it('cherche dans le nom ou la ville, sans tenir compte de la casse', async () => {
      const villeneuve = centre(
        '2d8a5b9c-1e4f-4a3b-8c7d-8e9f0a1b2c3d',
        'Antenne Est',
        'Villeneuve-sur-Lot',
      );
      await contexte.enregistrer([agen, marmande, villeneuve]);

      const parNom = await contexte.lectures.list({ recherche: 'MARMANDE' });
      const parVille = await contexte.lectures.list({
        recherche: 'villeneuve',
      });

      expect(parNom.map((vue) => vue.id)).toEqual([ID_MARMANDE]);
      expect(parVille.map((vue) => vue.nom)).toEqual(['Antenne Est']);
    });

    it('combine le statut et la recherche', async () => {
      await contexte.enregistrer([agen, marmande, nerac]);

      const vues = await contexte.lectures.list({
        statut: StatutCentre.ACTIF,
        recherche: 'centre',
      });

      expect(vues.map((vue) => vue.id)).toEqual([ID_AGEN]);
    });

    it('relit un centre avec ses magasins', async () => {
      await contexte.enregistrer(
        [agen],
        [magasin('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b', 'Leclerc', agen)],
      );

      const vue = await contexte.lectures.get(agen.id);

      expect(vue?.nom).toBe("Centre d'Agen");
      expect(vue?.magasins).toEqual({ actifs: 1, inactifs: 0 });
    });

    it('renvoie null pour un centre inconnu', async () => {
      await contexte.enregistrer([agen]);

      expect(await contexte.lectures.get(CentreId.creer(ID_NERAC))).toBeNull();
    });
  });
}

function centre(
  id: string,
  nom: string,
  ville: string,
  options: { contacts?: boolean; statut?: StatutCentre } = {},
): Centre {
  return Centre.reconstituer({
    id: CentreId.creer(id),
    nom: Nom.creer(nom),
    adresse: Adresse.creer('12 avenue Jean Jaurès'),
    codePostal: CodePostal.creer('47000'),
    ville: Ville.creer(ville),
    ...(options.contacts && {
      telephone: Telephone.creer('05 53 00 00 00'),
      email: Email.creer('agen@restosducoeur.org'),
    }),
    statut: options.statut ?? StatutCentre.ACTIF,
    creeLe: new Date('2026-10-01T09:00:00.000Z'),
    modifieLe: new Date('2026-10-02T14:30:00.000Z'),
  });
}

function magasin(
  id: string,
  nom: string,
  rattachement: Centre,
  options: { statut?: StatutMagasin } = {},
): Magasin {
  return Magasin.reconstituer({
    id: MagasinId.creer(id),
    nom: Nom.creer(nom),
    adresse: Adresse.creer(`${nom.length} avenue de la Liberté`),
    codePostal: CodePostal.creer('47000'),
    ville: Ville.creer('Agen'),
    centreId: rattachement.id,
    statut: options.statut ?? StatutMagasin.ACTIF,
    images: [],
    creeLe: new Date('2026-10-01T09:00:00.000Z'),
    modifieLe: new Date('2026-10-01T09:00:00.000Z'),
  });
}
