import {
  Adresse,
  CentreId,
  CodePostal,
  Email,
  FichierImage,
  ImageMagasinId,
  Magasin,
  MagasinId,
  Nom,
  Telephone,
  Ville,
} from '@rdc/referentiel-domain';
import { StatutMagasin } from '@rdc/referentiel-domain';
import {
  versImageMagasinReponse,
  versMagasinReponse,
  vueVersMagasinReponse,
} from './magasin.reponse';

describe('versMagasinReponse — format MagasinDto de RDC v1', () => {
  const identite = {
    id: MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b'),
    nom: Nom.creer('Leclerc Agen Sud'),
    adresse: Adresse.creer('1 avenue du Général de Gaulle'),
    codePostal: CodePostal.creer('47000'),
    ville: Ville.creer('Agen'),
    centreId: CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12'),
  };
  const maintenant = new Date('2026-10-01T09:00:00.000Z');

  it('expose tous les champs attendus par le front', () => {
    const magasin = Magasin.creer(
      {
        ...identite,
        telephone: Telephone.creer('05 53 98 76 54'),
        email: Email.creer('agen-sud@leclerc.fr'),
      },
      maintenant,
    );

    expect(versMagasinReponse(magasin)).toEqual({
      id: '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b',
      nom: 'Leclerc Agen Sud',
      ville: 'Agen',
      codePostal: '47000',
      adresse: '1 avenue du Général de Gaulle',
      telephone: '+33553987654',
      email: 'agen-sud@leclerc.fr',
      statut: 'ACTIF',
      centreId: '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
      images: [],
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-01T09:00:00.000Z',
    });
  });

  it('expose les images dans leur ordre, avec leur URL publique v1', () => {
    const magasin = Magasin.creer(identite, maintenant);
    const ajout = new Date('2026-10-02T10:00:00.000Z');
    for (const id of [
      '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d',
      '1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e',
    ]) {
      magasin.ajouterImage(
        {
          id: ImageMagasinId.creer(id),
          fichier: FichierImage.creer(`${id}.jpg`),
        },
        ajout,
      );
    }

    expect(versMagasinReponse(magasin).images).toEqual([
      {
        id: '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d',
        url: '/uploads/magasins/3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b/0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.jpg',
        ordre: 0,
        createdAt: '2026-10-02T10:00:00.000Z',
      },
      {
        id: '1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e',
        url: '/uploads/magasins/3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b/1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e.jpg',
        ordre: 1,
        createdAt: '2026-10-02T10:00:00.000Z',
      },
    ]);
  });

  it('omet téléphone et email quand ils sont absents', () => {
    const reponse = versMagasinReponse(Magasin.creer(identite, maintenant));

    expect(reponse).not.toHaveProperty('telephone');
    expect(reponse).not.toHaveProperty('email');
  });
});

describe('vueVersMagasinReponse — même MagasinDto depuis une vue de lecture', () => {
  it('expose les mêmes champs que la réponse de création', () => {
    expect(
      vueVersMagasinReponse({
        id: '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b',
        nom: 'Leclerc Agen Sud',
        adresse: '1 avenue du Général de Gaulle',
        codePostal: '47000',
        ville: 'Agen',
        email: 'agen-sud@leclerc.fr',
        statut: StatutMagasin.INACTIF,
        centreId: '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
        images: [
          {
            id: '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d',
            fichier: '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.png',
            ordre: 0,
            ajouteeLe: new Date('2026-10-02T10:00:00.000Z'),
          },
        ],
        creeLe: new Date('2026-10-01T09:00:00.000Z'),
        modifieLe: new Date('2026-10-02T14:30:00.000Z'),
      }),
    ).toEqual({
      id: '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b',
      nom: 'Leclerc Agen Sud',
      ville: 'Agen',
      codePostal: '47000',
      adresse: '1 avenue du Général de Gaulle',
      email: 'agen-sud@leclerc.fr',
      statut: 'INACTIF',
      centreId: '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
      images: [
        {
          id: '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d',
          url: '/uploads/magasins/3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b/0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.png',
          ordre: 0,
          createdAt: '2026-10-02T10:00:00.000Z',
        },
      ],
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-02T14:30:00.000Z',
    });
  });
});

describe('versImageMagasinReponse — réponse 201 de POST /api/magasins/:id/images (v1)', () => {
  it('expose id, url, ordre et createdAt', () => {
    const magasin = Magasin.creer(
      {
        id: MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b'),
        nom: Nom.creer('Leclerc Agen Sud'),
        adresse: Adresse.creer('1 avenue du Général de Gaulle'),
        codePostal: CodePostal.creer('47000'),
        ville: Ville.creer('Agen'),
        centreId: CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12'),
      },
      new Date('2026-10-01T09:00:00.000Z'),
    );
    const image = magasin.ajouterImage(
      {
        id: ImageMagasinId.creer('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d'),
        fichier: FichierImage.creer(
          '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.webp',
        ),
      },
      new Date('2026-10-02T10:00:00.000Z'),
    );

    expect(versImageMagasinReponse(magasin.id, image)).toEqual({
      id: '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d',
      url: '/uploads/magasins/3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b/0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.webp',
      ordre: 0,
      createdAt: '2026-10-02T10:00:00.000Z',
    });
  });
});
