import {
  Adresse,
  Centre,
  CentreId,
  CodePostal,
  Magasin,
  MagasinId,
  Nom,
  StatutCentre,
  StatutMagasin,
  Ville,
} from '@rdc/referentiel-domain';
import { CentreIntrouvable } from '../../errors';
import { unCentreExistant } from '../../testing/centre-existant.test-utils';
import { LecturesCentresEnMemoire } from '../../testing/lectures-centres-en-memoire.test-utils';
import type { FiltreCentres } from './lectures-centres';
import {
  ListerCentresQuery,
  OrdreTri,
  TriCentres,
} from './lister-centres.query';
import { ObtenirCentreQuery } from './obtenir-centre.query';

describe('requêtes de lecture des centres', () => {
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');
  const lectures = new LecturesCentresEnMemoire([
    unCentreExistant(centreId, StatutCentre.ACTIF),
  ]);

  describe('ListerCentresQuery', () => {
    it('renvoie tous les centres sans critère', async () => {
      const vues = await new ListerCentresQuery(lectures).execute({});

      expect(vues.map((v) => v.id)).toEqual([centreId.valeur]);
    });

    it('transmet le statut et la recherche nettoyée', async () => {
      const espion = jest.spyOn(lectures, 'list');

      await new ListerCentresQuery(lectures).execute({
        statut: StatutCentre.INACTIF,
        recherche: '  agen ',
      });

      expect(espion).toHaveBeenLastCalledWith<[FiltreCentres]>({
        statut: StatutCentre.INACTIF,
        recherche: 'agen',
      });
    });

    it.each(['', '   '])(
      'ignore une recherche vide (%j)',
      async (recherche) => {
        const espion = jest.spyOn(lectures, 'list');

        await new ListerCentresQuery(lectures).execute({ recherche });

        expect(espion).toHaveBeenLastCalledWith<[FiltreCentres]>({});
      },
    );
  });

  describe('ObtenirCentreQuery', () => {
    it('renvoie la vue du centre', async () => {
      const vue = await new ObtenirCentreQuery(lectures).execute({ centreId });

      expect(vue.id).toBe(centreId.valeur);
    });

    it('refuse un centre inconnu (CENTRE_NOT_FOUND)', async () => {
      const inconnu = CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b');

      await expect(
        new ObtenirCentreQuery(lectures).execute({ centreId: inconnu }),
      ).rejects.toThrow(CentreIntrouvable);
    });
  });

  describe('ListerCentresQuery — tri des colonnes', () => {
    // Agen : actif, 1 magasin ; Boé : archivé, 0 ; Marmande : actif, 3
    // (dont 1 inactif) ; Nérac : inactif, 1.
    const agen = centre(
      '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
      "Centre d'Agen",
    );
    const boe = centre(
      '0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b',
      'Centre de Boé',
      StatutCentre.ARCHIVE,
    );
    const marmande = centre(
      '1c7f4a8b-0d3e-4f2a-9b6c-7d8e9f0a1b2c',
      'Centre de Marmande',
    );
    const nerac = centre(
      '2d8a5b9c-1e4f-4a3b-8c7d-8e9f0a1b2c3d',
      'Centre de Nérac',
      StatutCentre.INACTIF,
    );
    const lecturesTri = new LecturesCentresEnMemoire(
      [nerac, marmande, boe, agen],
      [
        magasin('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b', agen),
        magasin('5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c', marmande),
        magasin('6d0c7f80-2b34-4c9d-9e30-9b3e1f904f6d', marmande),
        magasin(
          '7e1d8091-3c45-4dae-8f41-0c4f2a015a7e',
          marmande,
          StatutMagasin.INACTIF,
        ),
        magasin('8f2e91a2-4d56-4ebf-9052-1d5a3b126b8f', nerac),
      ],
    );

    async function noms(tri?: TriCentres, ordre?: OrdreTri): Promise<string[]> {
      const vues = await new ListerCentresQuery(lecturesTri).execute({
        ...(tri && { tri }),
        ...(ordre && { ordre }),
      });
      return vues.map((vue) => vue.nom);
    }

    it('trie par nom croissant par défaut', async () => {
      expect(await noms()).toEqual([
        "Centre d'Agen",
        'Centre de Boé',
        'Centre de Marmande',
        'Centre de Nérac',
      ]);
    });

    it('trie par nom décroissant', async () => {
      expect(await noms(TriCentres.NOM, OrdreTri.DECROISSANT)).toEqual([
        'Centre de Nérac',
        'Centre de Marmande',
        'Centre de Boé',
        "Centre d'Agen",
      ]);
    });

    it('trie par statut dans l’ordre du cycle de vie (actif, inactif, archivé), puis par nom', async () => {
      expect(await noms(TriCentres.STATUT)).toEqual([
        "Centre d'Agen",
        'Centre de Marmande',
        'Centre de Nérac',
        'Centre de Boé',
      ]);
    });

    it('trie par statut décroissant, en gardant le nom croissant à égalité', async () => {
      expect(await noms(TriCentres.STATUT, OrdreTri.DECROISSANT)).toEqual([
        'Centre de Boé',
        'Centre de Nérac',
        "Centre d'Agen",
        'Centre de Marmande',
      ]);
    });

    it('trie par nombre de magasins rattachés (actifs + inactifs), puis par nom', async () => {
      expect(await noms(TriCentres.MAGASINS)).toEqual([
        'Centre de Boé',
        "Centre d'Agen",
        'Centre de Nérac',
        'Centre de Marmande',
      ]);
      expect(await noms(TriCentres.MAGASINS, OrdreTri.DECROISSANT)).toEqual([
        'Centre de Marmande',
        "Centre d'Agen",
        'Centre de Nérac',
        'Centre de Boé',
      ]);
    });
  });
});

function centre(
  id: string,
  nom: string,
  statut: StatutCentre = StatutCentre.ACTIF,
): Centre {
  return Centre.reconstituer({
    id: CentreId.creer(id),
    nom: Nom.creer(nom),
    adresse: Adresse.creer('12 avenue Jean Jaurès'),
    codePostal: CodePostal.creer('47000'),
    ville: Ville.creer('Agen'),
    statut,
    creeLe: new Date('2026-10-01T09:00:00.000Z'),
    modifieLe: new Date('2026-10-01T09:00:00.000Z'),
  });
}

function magasin(
  id: string,
  rattachement: Centre,
  statut: StatutMagasin = StatutMagasin.ACTIF,
): Magasin {
  return Magasin.reconstituer({
    id: MagasinId.creer(id),
    nom: Nom.creer(`Magasin ${id.slice(0, 4)}`),
    adresse: Adresse.creer('1 avenue de la Liberté'),
    codePostal: CodePostal.creer('47000'),
    ville: Ville.creer('Agen'),
    centreId: rattachement.id,
    statut,
    creeLe: new Date('2026-10-01T09:00:00.000Z'),
    modifieLe: new Date('2026-10-01T09:00:00.000Z'),
  });
}
