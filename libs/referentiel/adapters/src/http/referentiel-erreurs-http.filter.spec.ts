import type { ArgumentsHost, Type } from '@nestjs/common';
import { FILTER_CATCH_EXCEPTIONS } from '@nestjs/common/constants';
import {
  CentreDejaExistant,
  CentreIntrouvable,
} from '@rdc/referentiel-application';
import {
  AdresseAbreviationInterdite,
  AdresseTropLongue,
  AdresseVide,
  CentreArchive,
  CentreId,
  CentreIdInvalide,
  CentreIdVide,
  CodePostalInvalide,
  EmailInvalide,
  EmailTropLong,
  EmailVide,
  NomTropLong,
  NomVide,
  TelephoneInvalide,
  TelephoneVide,
  VilleTropLongue,
  VilleVide,
} from '@rdc/referentiel-domain';
import { CentrePersisteInvalide } from '../prisma/centre-persiste-invalide';
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
});
