import {
  ContenuImage,
  FormatImage,
  ImageFormatNonSupporte,
  ImageTropVolumineuse,
  TAILLE_MAXIMALE_IMAGE,
} from './contenu-image';
import { FichierImage } from './fichier-image';
import { ImageMagasinId } from './image-magasin-id';

/** Octets donnés suivis de zéros, pour atteindre une taille réaliste. */
function octets(debut: readonly number[], taille = 64): Uint8Array {
  const contenu = new Uint8Array(Math.max(taille, debut.length));
  contenu.set(debut);
  return contenu;
}

function texte(valeur: string): number[] {
  return [...valeur].map((caractere) => caractere.charCodeAt(0));
}

const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP = [...texte('RIFF'), 0x24, 0x00, 0x00, 0x00, ...texte('WEBP')];

describe('ContenuImage — format reconnu par la signature (audit A-18)', () => {
  it.each([
    ['JPEG', JPEG, FormatImage.JPEG],
    ['PNG', PNG, FormatImage.PNG],
    ['WebP', WEBP, FormatImage.WEBP],
  ])('reconnaît un %s', (_nom, signature, format) => {
    const contenu = ContenuImage.creer(octets(signature));

    expect(contenu.format).toBe(format);
    expect(contenu.octets).toHaveLength(64);
  });

  it.each([
    ['un GIF', texte('GIF89a')],
    ['un PDF', texte('%PDF-1.7')],
    ['un texte renommé .jpg', texte('Ceci est un texte, pas une photo.')],
    [
      'un RIFF qui n’est pas un WebP (WAV)',
      [...texte('RIFF'), 0, 0, 0, 0, ...texte('WAVE')],
    ],
    ['un PNG tronqué', PNG.slice(0, 5)],
  ])('refuse %s : IMAGE_FORMAT_NON_SUPPORTE', (_cas, debut) => {
    let erreur: unknown;
    try {
      ContenuImage.creer(octets(debut, debut.length));
    } catch (cause) {
      erreur = cause;
    }

    expect(erreur).toBeInstanceOf(ImageFormatNonSupporte);
    expect(erreur).toMatchObject({ code: 'IMAGE_FORMAT_NON_SUPPORTE' });
  });

  it('refuse un contenu vide', () => {
    expect(() => ContenuImage.creer(new Uint8Array(0))).toThrow(
      ImageFormatNonSupporte,
    );
  });
});

describe('ContenuImage — taille maximale de 5 Mo (v1)', () => {
  it('vaut 5 × 1024 × 1024 octets', () => {
    expect(TAILLE_MAXIMALE_IMAGE).toBe(5 * 1024 * 1024);
  });

  it('accepte une image de 5 Mo exactement', () => {
    expect(ContenuImage.creer(octets(JPEG, TAILLE_MAXIMALE_IMAGE)).format).toBe(
      FormatImage.JPEG,
    );
  });

  it('refuse une image de 5 Mo + 1 octet : IMAGE_TROP_VOLUMINEUSE', () => {
    let erreur: unknown;
    try {
      ContenuImage.creer(octets(JPEG, TAILLE_MAXIMALE_IMAGE + 1));
    } catch (cause) {
      erreur = cause;
    }

    expect(erreur).toBeInstanceOf(ImageTropVolumineuse);
    expect(erreur).toMatchObject({ code: 'IMAGE_TROP_VOLUMINEUSE' });
  });
});

describe('FichierImage.pour — nom généré, extension du format reconnu', () => {
  const id = ImageMagasinId.creer('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d');

  it.each([
    [FormatImage.JPEG, 'jpg'],
    [FormatImage.PNG, 'png'],
    [FormatImage.WEBP, 'webp'],
  ])('nomme une image %s <uuid>.%s', (format, extension) => {
    expect(FichierImage.pour(id, format).valeur).toBe(
      `0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.${extension}`,
    );
  });
});
