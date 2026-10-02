import {
  FormatImage,
  ImageFormatNonSupporte,
  ImageMagasinIdInvalide,
  ImageTropVolumineuse,
  MagasinIdInvalide,
  TAILLE_MAXIMALE_IMAGE,
} from '@rdc/referentiel-domain';
import {
  versAjouterImageMagasinCommande,
  versRetirerImageMagasinCommande,
} from './images-magasin.requete';

const magasinId = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';
const imageId = '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d';
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('versAjouterImageMagasinCommande — fichier multipart → commande', () => {
  it('construit le MagasinId et le contenu reconnu par sa signature', () => {
    const commande = versAjouterImageMagasinCommande(magasinId, {
      buffer: JPEG,
      mimetype: 'image/png',
      originalname: 'x./../evil',
    });

    expect(commande.magasinId.valeur).toBe(magasinId);
    expect(commande.contenu.format).toBe(FormatImage.JPEG);
    expect(commande.contenu.octets).toEqual(new Uint8Array(JPEG));
  });

  it('refuse un PDF annoncé image/jpeg (IMAGE_FORMAT_NON_SUPPORTE)', () => {
    expect(() =>
      versAjouterImageMagasinCommande(magasinId, {
        buffer: Buffer.from('%PDF-1.7 ...'),
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
      }),
    ).toThrow(ImageFormatNonSupporte);
  });

  it('refuse un contenu de plus de 5 Mo (IMAGE_TROP_VOLUMINEUSE)', () => {
    const tropGros = Buffer.alloc(TAILLE_MAXIMALE_IMAGE + 1);
    JPEG.copy(tropGros);

    expect(() =>
      versAjouterImageMagasinCommande(magasinId, {
        buffer: tropGros,
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
      }),
    ).toThrow(ImageTropVolumineuse);
  });

  it('laisse le domaine refuser un identifiant de magasin mal formé', () => {
    expect(() =>
      versAjouterImageMagasinCommande('pas-un-uuid', {
        buffer: JPEG,
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
      }),
    ).toThrow(MagasinIdInvalide);
  });
});

describe('versRetirerImageMagasinCommande — paramètres :id et :imageId', () => {
  it('construit les identifiants typés', () => {
    const commande = versRetirerImageMagasinCommande(magasinId, imageId);

    expect(commande.magasinId.valeur).toBe(magasinId);
    expect(commande.imageId.valeur).toBe(imageId);
  });

  it('laisse le domaine refuser un identifiant d’image mal formé', () => {
    expect(() => versRetirerImageMagasinCommande(magasinId, '../evil')).toThrow(
      ImageMagasinIdInvalide,
    );
  });
});
