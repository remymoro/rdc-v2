import {
  AdresseAbreviationInterdite,
  FichierImageInvalide,
  Magasin,
  StatutMagasin,
  TelephoneInvalide,
} from '@rdc/referentiel-domain';
import type { Prisma } from '@rdc/shared-kernel-adapters';
import { MagasinPersisteInvalide } from './magasin-persiste-invalide';
import {
  versLigneMagasin,
  versLignesImagesMagasin,
  versMagasin,
  type LigneMagasinAvecImages,
} from './magasin.mapper';

// Filet local du mapper : la suite de contrat Prisma demande PostgreSQL.
describe('mapper Magasin ↔ ligne Prisma', () => {
  function uneLigne(
    surcharges: Partial<LigneMagasinAvecImages> = {},
  ): LigneMagasinAvecImages {
    return {
      id: '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b',
      nom: 'Leclerc Agen Sud',
      adresse: '1 avenue du Général de Gaulle',
      codePostal: '47000',
      ville: 'Agen',
      telephone: '+33553987654',
      email: 'agen-sud@leclerc.fr',
      statut: 'INACTIF',
      centreId: '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
      createdAt: new Date('2026-10-01T09:00:00.000Z'),
      updatedAt: new Date('2026-10-02T14:30:00.000Z'),
      cleDoublon: null,
      images: [],
      ...surcharges,
    };
  }

  const ID_MAGASIN = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';
  const ID_IMAGE_1 = '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d';
  const ID_IMAGE_2 = '1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e';

  function uneImage(
    surcharges: Partial<Prisma.MagasinImageModel> = {},
  ): Prisma.MagasinImageModel {
    return {
      id: ID_IMAGE_1,
      url: `/uploads/magasins/${ID_MAGASIN}/${ID_IMAGE_1}.jpg`,
      ordre: 0,
      magasinId: ID_MAGASIN,
      createdAt: new Date('2026-10-02T10:00:00.000Z'),
      ...surcharges,
    };
  }

  it('reconstitue le magasin avec son centre, son statut et ses dates', () => {
    const magasin = versMagasin(uneLigne());

    expect(magasin).toBeInstanceOf(Magasin);
    expect(magasin.centreId.valeur).toBe(
      '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
    );
    expect(magasin.statut).toBe(StatutMagasin.INACTIF);
    expect(magasin.creeLe).toEqual(new Date('2026-10-01T09:00:00.000Z'));
    expect(magasin.modifieLe).toEqual(new Date('2026-10-02T14:30:00.000Z'));
  });

  it.each(['ACTIF', 'INACTIF', 'ARCHIVE'] as const)(
    'fait l’aller-retour d’un magasin %s sans perte',
    (statut) => {
      const ligne = uneLigne({ statut });

      const { cleDoublon: _cle, ...relue } = versLigneMagasin(
        versMagasin(ligne),
      );

      const { cleDoublon: _attendue, images: _images, ...attendue } = ligne;
      expect(relue).toEqual(attendue);
    },
  );

  it('écrit la clé de doublon du magasin', () => {
    const ligne = versLigneMagasin(versMagasin(uneLigne()));

    expect(ligne.cleDoublon).toBe(
      'LECLERCAGENSUD|AGEN|47000|1AVENUEDUGENERALDEGAULLE',
    );
  });

  it('traduit un téléphone ou un email absent par undefined', () => {
    const magasin = versMagasin(uneLigne({ telephone: null, email: null }));

    expect(magasin.telephone).toBeUndefined();
    expect(magasin.email).toBeUndefined();
  });

  // Lignes v1 non reprises (ADR-0008) : échec explicite de l'adapter, pas une
  // erreur de saisie (TENETS-VALUE-003, ERROR-005).
  it.each([
    ['un téléphone en 08', { telephone: '0812345678' }, TelephoneInvalide],
    [
      'une adresse abrégée',
      { adresse: '1 av du Général de Gaulle' },
      AdresseAbreviationInterdite,
    ],
  ] as const)(
    'refuse une ligne avec %s par MagasinPersisteInvalide en gardant la cause',
    (_cas, surcharges, causeAttendue) => {
      const ligne = uneLigne(surcharges);

      let erreur: unknown;
      try {
        versMagasin(ligne);
      } catch (e) {
        erreur = e;
      }

      expect(erreur).toBeInstanceOf(MagasinPersisteInvalide);
      const echec = erreur as MagasinPersisteInvalide;
      expect(echec.idLigne).toBe(ligne.id);
      expect(echec.code).toBe('MAGASIN_PERSISTED_INVALID');
      expect(echec.cause).toBeInstanceOf(causeAttendue);
      expect(echec.message).not.toContain(ligne.adresse);
      expect(echec.message).not.toContain(ligne.telephone);
    },
  );

  describe('images (RDC-REF-007)', () => {
    it('reconstitue les images dans leur ordre, avec le fichier tiré de l’URL v1', () => {
      const magasin = versMagasin(
        uneLigne({
          images: [
            uneImage({
              id: ID_IMAGE_2,
              url: `/uploads/magasins/${ID_MAGASIN}/${ID_IMAGE_2}.png`,
              ordre: 1,
            }),
            uneImage(),
          ],
        }),
      );

      expect(
        magasin.images.map((image) => [
          image.id.valeur,
          image.fichier.valeur,
          image.ordre,
          image.ajouteeLe,
        ]),
      ).toEqual([
        [
          ID_IMAGE_1,
          `${ID_IMAGE_1}.jpg`,
          0,
          new Date('2026-10-02T10:00:00.000Z'),
        ],
        [
          ID_IMAGE_2,
          `${ID_IMAGE_2}.png`,
          1,
          new Date('2026-10-02T10:00:00.000Z'),
        ],
      ]);
    });

    it('relit une URL absolue d’avant le stockage local (ADR-0008)', () => {
      const magasin = versMagasin(
        uneLigne({
          images: [
            uneImage({
              url: `https://rdc.blob.core.windows.net/images/magasins/${ID_MAGASIN}/${ID_IMAGE_1}.JPG`,
            }),
          ],
        }),
      );

      expect(magasin.images[0]?.fichier.valeur).toBe(`${ID_IMAGE_1}.JPG`);
    });

    it('refuse une URL dont le fichier n’a pas un nom UUID (audit A-18)', () => {
      const ligne = uneLigne({
        images: [
          uneImage({ url: `/uploads/magasins/${ID_MAGASIN}/x./../evil` }),
        ],
      });

      let erreur: unknown;
      try {
        versMagasin(ligne);
      } catch (e) {
        erreur = e;
      }

      expect(erreur).toBeInstanceOf(MagasinPersisteInvalide);
      expect((erreur as Error).cause).toBeInstanceOf(FichierImageInvalide);
    });

    it('écrit chaque image avec son URL publique v1, sa position et sa date', () => {
      const magasin = versMagasin(
        uneLigne({
          images: [
            uneImage(),
            uneImage({
              id: ID_IMAGE_2,
              url: `/uploads/magasins/${ID_MAGASIN}/${ID_IMAGE_2}.webp`,
              ordre: 1,
            }),
          ],
        }),
      );

      expect(versLignesImagesMagasin(magasin)).toEqual([
        uneImage(),
        uneImage({
          id: ID_IMAGE_2,
          url: `/uploads/magasins/${ID_MAGASIN}/${ID_IMAGE_2}.webp`,
          ordre: 1,
        }),
      ]);
    });
  });
});
