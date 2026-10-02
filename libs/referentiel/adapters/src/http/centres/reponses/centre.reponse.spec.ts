import {
  Adresse,
  Centre,
  CentreId,
  CodePostal,
  Email,
  Nom,
  Telephone,
  Ville,
} from '@rdc/referentiel-domain';
import type { VueCentre } from '@rdc/referentiel-application';
import { StatutCentre } from '@rdc/referentiel-domain';
import { versCentreReponse, vueVersCentreReponse } from './centre.reponse';

describe('versCentreReponse — format CentreDto de RDC v1', () => {
  const identite = {
    id: CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12'),
    nom: Nom.creer("Centre d'Agen"),
    adresse: Adresse.creer('12 avenue Jean Jaurès'),
    codePostal: CodePostal.creer('47000'),
    ville: Ville.creer('Agen'),
  };
  const maintenant = new Date('2026-10-01T09:00:00.000Z');

  it('expose tous les champs attendus par le front', () => {
    const centre = Centre.creer(
      {
        ...identite,
        telephone: Telephone.creer('05 53 12 34 56'),
        email: Email.creer('agen@restosducoeur.org'),
      },
      maintenant,
    );

    expect(versCentreReponse(centre)).toEqual({
      id: '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
      nom: "Centre d'Agen",
      ville: 'Agen',
      codePostal: '47000',
      adresse: '12 avenue Jean Jaurès',
      telephone: '+33553123456',
      email: 'agen@restosducoeur.org',
      statut: 'ACTIF',
      responsablesCount: 0,
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-01T09:00:00.000Z',
    });
  });

  it('omet téléphone et email quand ils sont absents', () => {
    const reponse = versCentreReponse(Centre.creer(identite, maintenant));

    expect(reponse).not.toHaveProperty('telephone');
    expect(reponse).not.toHaveProperty('email');
  });
});

describe('vueVersCentreReponse — lecture, avec les magasins rattachés', () => {
  const vue: VueCentre = {
    id: '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
    nom: "Centre d'Agen",
    adresse: '12 avenue Jean Jaurès',
    codePostal: '47000',
    ville: 'Agen',
    statut: StatutCentre.INACTIF,
    magasins: { actifs: 8, inactifs: 2 },
    creeLe: new Date('2026-10-01T09:00:00.000Z'),
    modifieLe: new Date('2026-10-02T14:30:00.000Z'),
  };

  it('garde le format CentreDto et ajoute les magasins', () => {
    expect(vueVersCentreReponse(vue)).toEqual({
      id: '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
      nom: "Centre d'Agen",
      ville: 'Agen',
      codePostal: '47000',
      adresse: '12 avenue Jean Jaurès',
      statut: 'INACTIF',
      responsablesCount: 0,
      magasins: { actifs: 8, inactifs: 2 },
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-02T14:30:00.000Z',
    });
  });

  it('expose téléphone et email quand ils existent', () => {
    const reponse = vueVersCentreReponse({
      ...vue,
      telephone: '+33553123456',
      email: 'agen@restosducoeur.org',
    });

    expect(reponse).toMatchObject({
      telephone: '+33553123456',
      email: 'agen@restosducoeur.org',
    });
  });
});
