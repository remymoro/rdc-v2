import type { ArgumentsHost } from '@nestjs/common';
import { CentreDejaExistant } from '@rdc/referentiel-application';
import {
  AdresseAbreviationInterdite,
  AdresseTropLongue,
  AdresseVide,
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
});
