import { CentreId } from '../centre/centre-id';
import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Email } from '../commun/email';
import { Nom } from '../commun/nom';
import { Telephone } from '../commun/telephone';
import { Ville } from '../commun/ville';
import { Magasin } from './magasin';
import { FichierImage } from './image/fichier-image';
import { ImageMagasin } from './image/image-magasin';
import { ImageMagasinId } from './image/image-magasin-id';
import {
  MagasinArchive,
  MagasinImageDejaPresente,
  MagasinImageIntrouvable,
} from './magasin.errors';
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
        images: [],
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
        images: [],
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
        images: [],
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

  describe('images (RDC-REF-007)', () => {
    const plusTard = new Date('2026-10-25T10:00:00.000Z');
    const precedemment = new Date('2026-10-20T14:00:00.000Z');
    const ID_IMAGE_1 = '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d';
    const ID_IMAGE_2 = '1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e';
    const ID_IMAGE_3 = '2f6a4dae-8c3b-4e5a-9d9f-7b4cae3e6d8f';

    function nouvelleImage(id: string) {
      return {
        id: ImageMagasinId.creer(id),
        fichier: FichierImage.creer(`${id}.jpg`),
      };
    }

    function imagePersistee(id: string, ordre: number): ImageMagasin {
      return ImageMagasin.reconstituer({
        ...nouvelleImage(id),
        ordre,
        ajouteeLe: precedemment,
      });
    }

    function existant(
      images: readonly ImageMagasin[] = [],
      statut = StatutMagasin.ACTIF,
    ): Magasin {
      return Magasin.reconstituer({
        ...donneesObligatoires(),
        statut,
        images,
        creeLe: maintenant,
        modifieLe: precedemment,
      });
    }

    it('un nouveau magasin n’a pas d’image', () => {
      expect(Magasin.creer(donneesObligatoires(), maintenant).images).toEqual(
        [],
      );
    });

    it('reconstitue les images triées par ordre', () => {
      const magasin = existant([
        imagePersistee(ID_IMAGE_2, 1),
        imagePersistee(ID_IMAGE_1, 0),
      ]);

      expect(magasin.images.map((image) => image.id.valeur)).toEqual([
        ID_IMAGE_1,
        ID_IMAGE_2,
      ]);
    });

    it('ajoute une image à la fin, datée, et date la modification du magasin', () => {
      const magasin = existant([imagePersistee(ID_IMAGE_1, 0)]);

      const ajoutee = magasin.ajouterImage(nouvelleImage(ID_IMAGE_2), plusTard);

      expect(ajoutee.ordre).toBe(1);
      expect(ajoutee.ajouteeLe).toEqual(plusTard);
      expect(ajoutee.fichier.valeur).toBe(`${ID_IMAGE_2}.jpg`);
      expect(magasin.images.map((image) => image.id.valeur)).toEqual([
        ID_IMAGE_1,
        ID_IMAGE_2,
      ]);
      expect(magasin.modifieLe).toEqual(plusTard);
    });

    it('donne l’ordre 0 à la première image', () => {
      const magasin = existant();

      expect(
        magasin.ajouterImage(nouvelleImage(ID_IMAGE_1), plusTard).ordre,
      ).toBe(0);
    });

    it('place une nouvelle image après la plus grande position, même après un retrait', () => {
      const magasin = existant([
        imagePersistee(ID_IMAGE_1, 0),
        imagePersistee(ID_IMAGE_2, 1),
      ]);
      magasin.retirerImage(ImageMagasinId.creer(ID_IMAGE_1), plusTard);

      expect(
        magasin.ajouterImage(nouvelleImage(ID_IMAGE_3), plusTard).ordre,
      ).toBe(2);
    });

    it('refuse un identifiant déjà présent (MAGASIN_IMAGE_DEJA_PRESENTE)', () => {
      const magasin = existant([imagePersistee(ID_IMAGE_1, 0)]);

      let erreur: unknown;
      try {
        magasin.ajouterImage(nouvelleImage(ID_IMAGE_1), plusTard);
      } catch (cause) {
        erreur = cause;
      }

      expect(erreur).toBeInstanceOf(MagasinImageDejaPresente);
      expect(erreur).toMatchObject({ code: 'MAGASIN_IMAGE_DEJA_PRESENTE' });
      expect(magasin.images).toHaveLength(1);
      expect(magasin.modifieLe).toEqual(precedemment);
    });

    it('retire une image, renvoie l’image retirée et date la modification', () => {
      const magasin = existant([
        imagePersistee(ID_IMAGE_1, 0),
        imagePersistee(ID_IMAGE_2, 1),
      ]);

      const retiree = magasin.retirerImage(
        ImageMagasinId.creer(ID_IMAGE_1),
        plusTard,
      );

      expect(retiree.fichier.valeur).toBe(`${ID_IMAGE_1}.jpg`);
      expect(magasin.images.map((image) => image.id.valeur)).toEqual([
        ID_IMAGE_2,
      ]);
      expect(magasin.modifieLe).toEqual(plusTard);
    });

    it('refuse de retirer une image absente (MAGASIN_IMAGE_INTROUVABLE)', () => {
      const magasin = existant([imagePersistee(ID_IMAGE_1, 0)]);

      let erreur: unknown;
      try {
        magasin.retirerImage(ImageMagasinId.creer(ID_IMAGE_2), plusTard);
      } catch (cause) {
        erreur = cause;
      }

      expect(erreur).toBeInstanceOf(MagasinImageIntrouvable);
      expect(erreur).toMatchObject({ code: 'MAGASIN_IMAGE_INTROUVABLE' });
      expect(magasin.images).toHaveLength(1);
      expect(magasin.modifieLe).toEqual(precedemment);
    });

    it.each([
      [
        'ajouter',
        (m: Magasin) => m.ajouterImage(nouvelleImage(ID_IMAGE_2), plusTard),
      ],
      [
        'retirer',
        (m: Magasin) =>
          m.retirerImage(ImageMagasinId.creer(ID_IMAGE_1), plusTard),
      ],
    ] as const)(
      'refuse d’%s une image d’un magasin archivé (MAGASIN_ARCHIVED)',
      (_action, executer) => {
        const magasin = existant(
          [imagePersistee(ID_IMAGE_1, 0)],
          StatutMagasin.ARCHIVE,
        );

        expect(() => executer(magasin)).toThrow(MagasinArchive);
        expect(magasin.images).toHaveLength(1);
      },
    );

    it('protège sa liste d’images contre une modification extérieure', () => {
      const magasin = existant([imagePersistee(ID_IMAGE_1, 0)]);

      (magasin.images as ImageMagasin[]).pop();

      expect(magasin.images).toHaveLength(1);
    });
  });
});
