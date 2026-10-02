import 'reflect-metadata';
import {
  type INestApplication,
  NotFoundException,
  type Type,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MagasinsController } from '../magasins.controller';

describe('Images magasin — limites multipart réelles', () => {
  let app: INestApplication;
  let url: string;
  const execute = jest.fn();

  beforeAll(async () => {
    const dependances: Type<unknown>[] = Reflect.getMetadata(
      'design:paramtypes',
      MagasinsController,
    );
    const module = await Test.createTestingModule({
      controllers: [MagasinsController],
      providers: dependances.map((provide) => ({
        provide,
        useValue: { execute },
      })),
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    url =
      (await app.getUrl()) +
      '/magasins/3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b/images';
  });
  beforeEach(() =>
    execute.mockReset().mockRejectedValue(new NotFoundException()),
  );
  afterAll(async () => {
    await app?.close();
  });

  function image(): Blob {
    return new Blob([new Uint8Array([0xff, 0xd8, 0xff, 42])], {
      type: 'image/jpeg',
    });
  }

  it('transmet un fichier unique au use case', async () => {
    const body = new FormData();
    body.append('file', image(), 'photo.jpg');
    const reponse = await fetch(url, { method: 'POST', body });
    expect(reponse.status).toBe(404); // Le use case témoin a reçu le fichier.
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it.each(['avant', 'après'])(
    'refuse un champ texte %s le fichier',
    async (position) => {
      const body = new FormData();
      if (position === 'avant') body.append('texte', 'intrus');
      body.append('file', image(), 'photo.jpg');
      if (position === 'après') body.append('texte', 'intrus');
      const reponse = await fetch(url, { method: 'POST', body });
      expect(reponse.status).toBe(400);
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it('refuse deux fichiers avant le use case', async () => {
    const body = new FormData();
    body.append('file', image(), 'un.jpg');
    body.append('file', image(), 'deux.jpg');
    const reponse = await fetch(url, { method: 'POST', body });
    expect(reponse.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });
});
