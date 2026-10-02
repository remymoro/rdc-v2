import {
  Adresse,
  CentreId,
  CodePostal,
  Email,
  Magasin,
  MagasinId,
  Nom,
  Telephone,
  Ville,
} from '@rdc/referentiel-domain';
import { StatutMagasin } from '@rdc/referentiel-domain';
import { versMagasinReponse, vueVersMagasinReponse } from './magasin.reponse';

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

  it('expose tous les champs attendus par le front, sans image (lot C)', () => {
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
      images: [],
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-02T14:30:00.000Z',
    });
  });
});
