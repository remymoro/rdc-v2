import { type ArgumentsHost, PayloadTooLargeException } from '@nestjs/common';
import { TeleversementImageFilter } from './televersement-image.filter';

describe('TeleversementImageFilter — fichier refusé par la limite de multer', () => {
  it('répond 413 IMAGE_TROP_VOLUMINEUSE, au format d’erreur de RDC', () => {
    const reponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const hote = {
      switchToHttp: () => ({
        getResponse: () => reponse,
        getRequest: () => ({ url: '/api/magasins/m/images' }),
      }),
    } as unknown as ArgumentsHost;

    new TeleversementImageFilter().catch(
      new PayloadTooLargeException('File too large'),
      hote,
    );

    expect(reponse.status).toHaveBeenCalledWith(413);
    expect(reponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 413,
        error: 'ImageTropVolumineuse',
        code: 'IMAGE_TROP_VOLUMINEUSE',
        message: "L'image dépasse la taille maximale de 5 Mo.",
        path: '/api/magasins/m/images',
      }),
    );
  });
});
