import type { ArgumentsHost } from '@nestjs/common';
import { envoyerErreur } from './reponse-erreur';

function hoteHttpDeTest(url = '/api/centres') {
  const reponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const hote = {
    switchToHttp: () => ({
      getResponse: () => reponse,
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;
  return { hote, reponse };
}

describe('envoyerErreur — format d’erreur de RDC v1', () => {
  it('répond avec statusCode, error, message, code, path et timestamp', () => {
    const { hote, reponse } = hoteHttpDeTest('/api/centres');

    envoyerErreur(hote, {
      statut: 409,
      nom: 'CentreDejaExistant',
      message: 'Un centre existe déjà.',
      code: 'CENTRE_ALREADY_EXISTS',
    });

    expect(reponse.status).toHaveBeenCalledWith(409);
    expect(reponse.json).toHaveBeenCalledWith({
      statusCode: 409,
      error: 'CentreDejaExistant',
      message: 'Un centre existe déjà.',
      code: 'CENTRE_ALREADY_EXISTS',
      path: '/api/centres',
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });
});
