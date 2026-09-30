import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ErreursHttpGlobalesFilter } from './erreurs-http-globales.filter';

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

describe('ErreursHttpGlobalesFilter', () => {
  const filtre = new ErreursHttpGlobalesFilter();

  it('traduit une requête mal formée en 400 REQUEST_VALIDATION (format v1)', () => {
    const { hote, reponse } = hoteHttp();

    filtre.catch(
      new BadRequestException({
        message: [
          'Le nom du centre est obligatoire.',
          'La ville est obligatoire.',
        ],
      }),
      hote,
    );

    expect(reponse.status).toHaveBeenCalledWith(400);
    expect(reponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'REQUEST_VALIDATION',
        error: 'RequestValidationException',
        message: 'Le nom du centre est obligatoire. La ville est obligatoire.',
      }),
    );
  });

  it('traduit une route inconnue en 404 RESOURCE_NOT_FOUND', () => {
    const { hote, reponse } = hoteHttp();

    filtre.catch(new NotFoundException(), hote);

    expect(reponse.status).toHaveBeenCalledWith(404);
    expect(reponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'RESOURCE_NOT_FOUND' }),
    );
  });

  describe('erreur inattendue (TENETS-ERROR-007)', () => {
    it('répond 500 INTERNAL_ERROR sans rien révéler de l’erreur', () => {
      const { hote, reponse } = hoteHttp();
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

      filtre.catch(
        new Error('SELECT * FROM "Centre" : mot de passe=secret'),
        hote,
      );

      expect(reponse.status).toHaveBeenCalledWith(500);
      const corps = reponse.json.mock.calls[0][0];
      expect(corps).toEqual(
        expect.objectContaining({ statusCode: 500, code: 'INTERNAL_ERROR' }),
      );
      expect(JSON.stringify(corps)).not.toContain('secret');
      expect(JSON.stringify(corps)).not.toContain('SELECT');
    });

    it('journalise l’erreur une seule fois, avec sa trace', () => {
      const { hote } = hoteHttp();
      const journal = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const erreur = new Error('panne');

      filtre.catch(erreur, hote);

      expect(journal).toHaveBeenCalledTimes(1);
      expect(journal.mock.calls[0]).toContain(erreur.stack);
    });

    afterEach(() => jest.restoreAllMocks());
  });
});
