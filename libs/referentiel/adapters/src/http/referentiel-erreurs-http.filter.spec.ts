import type { ArgumentsHost, Type } from '@nestjs/common';
import { FILTER_CATCH_EXCEPTIONS } from '@nestjs/common/constants';
import {
  CentreDejaExistant,
  CentreIntrouvable,
  MagasinIntrouvable,
} from '@rdc/referentiel-application';
import {
  AdresseAbreviationInterdite,
  AdresseTropLongue,
  AdresseVide,
  CentreArchive,
  CentreId,
  CentreIdInvalide,
  CentreIdVide,
  CentreNonActif,
  CodePostalInvalide,
  EmailInvalide,
  EmailTropLong,
  EmailVide,
  MagasinArchive,
  MagasinDejaExistant,
  MagasinId,
  MagasinIdInvalide,
  MagasinIdVide,
  NomTropLong,
  NomVide,
  TelephoneInvalide,
  TelephoneVide,
  VilleTropLongue,
  VilleVide,
} from '@rdc/referentiel-domain';
import { CentrePersisteInvalide } from '../prisma/centre-persiste-invalide';
import { MagasinPersisteInvalide } from '../prisma/magasin-persiste-invalide';
import { ReferentielErreursHttpFilter } from './referentiel-erreurs-http.filter';

function hoteHttp() {
  const reponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const hote = {
    switchToHttp: () => ({
      getResponse: () => reponse,
      getRequest: () => ({ url: '/api/centres' }),
    }),
  } as unknown as ArgumentsHost;
  return { hote, reponse };
}

describe('ReferentielErreursHttpFilter (TENETS-ERROR-006)', () => {
  const filtre = new ReferentielErreursHttpFilter();
  const unCentreId = CentreId.creer('0b8f5c3e-2d4a-4f6b-9c1d-7e8f9a0b1c2d');

  it('traduit un doublon en 409 CENTRE_ALREADY_EXISTS', () => {
    const { hote, reponse } = hoteHttp();

    filtre.catch(new CentreDejaExistant(), hote);

    expect(reponse.status).toHaveBeenCalledWith(409);
    expect(reponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        error: 'CentreDejaExistant',
        code: 'CENTRE_ALREADY_EXISTS',
      }),
    );
  });

  it('traduit un centre inconnu en 404 CENTRE_NOT_FOUND', () => {
    const { hote, reponse } = hoteHttp();

    filtre.catch(new CentreIntrouvable(unCentreId), hote);

    expect(reponse.status).toHaveBeenCalledWith(404);
    expect(reponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: 'CentreIntrouvable',
        message: 'Le centre demandé est introuvable.',
        code: 'CENTRE_NOT_FOUND',
      }),
    );
  });

  it('traduit un centre archivé en 409 CENTRE_ARCHIVED', () => {
    const { hote, reponse } = hoteHttp();

    filtre.catch(new CentreArchive(unCentreId), hote);

    expect(reponse.status).toHaveBeenCalledWith(409);
    expect(reponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        error: 'CentreArchive',
        code: 'CENTRE_ARCHIVED',
      }),
    );
  });

  // Magasins (lot A1) : statuts de RDC v1 (RDC-REF-001, RDC-REF-010).
  it.each([
    [
      new MagasinDejaExistant(),
      'MagasinDejaExistant',
      'MAGASIN_ALREADY_EXISTS',
    ],
    [new CentreNonActif(unCentreId), 'CentreNonActif', 'CENTRE_NON_ACTIF'],
  ])('traduit %s en 409', (erreur, nom, code) => {
    const { hote, reponse } = hoteHttp();

    filtre.catch(erreur, hote);

    expect(reponse.status).toHaveBeenCalledWith(409);
    expect(reponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, error: nom, code }),
    );
  });

  // Cycle de vie d'un magasin (lot A2) : mêmes statuts que pour le centre.
  it.each([
    [404, 'MagasinIntrouvable', 'MAGASIN_NOT_FOUND', MagasinIntrouvable],
    [409, 'MagasinArchive', 'MAGASIN_ARCHIVED', MagasinArchive],
  ] as const)('traduit en %i %s', (statut, nom, code, TypeErreur) => {
    const { hote, reponse } = hoteHttp();
    const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');

    filtre.catch(new TypeErreur(magasinId), hote);

    expect(reponse.status).toHaveBeenCalledWith(statut);
    expect(reponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: statut, error: nom, code }),
    );
  });

  // @Catch filtre par instanceof : une sous-classe d'une erreur listée doit
  // garder le statut de son parent, pas retomber sur un statut par défaut.
  it.each([
    ['CentreArchive', class extends CentreArchive {}, 409],
    ['CentreIntrouvable', class extends CentreIntrouvable {}, 404],
  ])(
    'traduit une sous-classe de %s comme son parent',
    (_, SousClasse, statut) => {
      const { hote, reponse } = hoteHttp();

      filtre.catch(new SousClasse(unCentreId), hote);

      expect(reponse.status).toHaveBeenCalledWith(statut);
    },
  );

  // Erreurs de validation métier : 400, comme en v1, avec le code du domaine.
  it.each([
    [new NomVide(), 'NOM_EMPTY'],
    [new NomTropLong(100), 'NOM_TOO_LONG'],
    [new CentreIdVide(), 'CENTRE_ID_EMPTY'],
    [new CentreIdInvalide(), 'CENTRE_ID_INVALID'],
    [new MagasinIdVide(), 'MAGASIN_ID_EMPTY'],
    [new MagasinIdInvalide(), 'MAGASIN_ID_INVALID'],
    [new CodePostalInvalide(), 'CODE_POSTAL_INVALID'],
    [new VilleVide(), 'VILLE_EMPTY'],
    [new VilleTropLongue(100), 'VILLE_TOO_LONG'],
    [new AdresseVide(), 'ADRESSE_EMPTY'],
    [new AdresseTropLongue(255), 'ADRESSE_TOO_LONG'],
    [
      new AdresseAbreviationInterdite('AV', 'Avenue'),
      'ADRESSE_ABREVIATION_INTERDITE',
    ],
    [new TelephoneVide(), 'TELEPHONE_EMPTY'],
    [new TelephoneInvalide(), 'TELEPHONE_INVALID'],
    [new EmailVide(), 'EMAIL_EMPTY'],
    [new EmailTropLong(254), 'EMAIL_TOO_LONG'],
    [new EmailInvalide(), 'EMAIL_INVALID'],
  ])('traduit %s en 400 %s', (erreur, code) => {
    const { hote, reponse } = hoteHttp();

    filtre.catch(erreur, hote);

    expect(reponse.status).toHaveBeenCalledWith(400);
    expect(reponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code,
        message: erreur.message,
      }),
    );
  });

  // Donnée corrompue en base : pas une erreur de saisie. Le filtre global la
  // journalise et répond 500 INTERNAL_ERROR (TENETS-VALUE-003, ERROR-007).
  it('ne capture pas CentrePersisteInvalide, même par sa cause de validation', () => {
    const typesCaptures: Type<Error>[] = Reflect.getMetadata(
      FILTER_CATCH_EXCEPTIONS,
      ReferentielErreursHttpFilter,
    );
    const erreur = new CentrePersisteInvalide(unCentreId.valeur, {
      cause: new TelephoneInvalide(),
    });

    expect(typesCaptures.length).toBeGreaterThan(0);
    expect(typesCaptures.some((type) => erreur instanceof type)).toBe(false);
  });

  it('ne capture pas MagasinPersisteInvalide, même par sa cause de validation', () => {
    const typesCaptures: Type<Error>[] = Reflect.getMetadata(
      FILTER_CATCH_EXCEPTIONS,
      ReferentielErreursHttpFilter,
    );
    const erreur = new MagasinPersisteInvalide(
      '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b',
      { cause: new TelephoneInvalide() },
    );

    expect(typesCaptures.some((type) => erreur instanceof type)).toBe(false);
  });
});
