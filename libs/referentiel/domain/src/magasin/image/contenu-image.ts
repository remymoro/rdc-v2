/** Taille maximale d'une image : 5 Mo, comme la v1. */
export const TAILLE_MAXIMALE_IMAGE = 5 * 1024 * 1024;

/** Formats d'image acceptés, comme la v1 : JPEG, PNG et WebP. */
export enum FormatImage {
  JPEG = 'JPEG',
  PNG = 'PNG',
  WEBP = 'WEBP',
}

/** Erreur métier : l'image dépasse la taille maximale (code v2). */
export class ImageTropVolumineuse extends Error {
  readonly code = 'IMAGE_TROP_VOLUMINEUSE';

  constructor() {
    super("L'image dépasse la taille maximale de 5 Mo.");
    this.name = 'ImageTropVolumineuse';
  }
}

/** Erreur métier : le contenu n'est ni un JPEG, ni un PNG, ni un WebP. */
export class ImageFormatNonSupporte extends Error {
  readonly code = 'IMAGE_FORMAT_NON_SUPPORTE';

  constructor() {
    super("Le format de l'image n'est pas supporté : JPEG, PNG ou WebP.");
    this.name = 'ImageFormatNonSupporte';
  }
}

/** Octets attendus à une position donnée du contenu. */
interface Signature {
  readonly position: number;
  readonly octets: readonly number[];
}

const ascii = (texte: string): number[] =>
  [...texte].map((caractere) => caractere.charCodeAt(0));

/**
 * Signatures (« nombres magiques ») de chaque format. Le type annoncé par le
 * client et le nom du fichier ne sont jamais lus (audit A-18).
 */
const SIGNATURES: ReadonlyMap<FormatImage, readonly Signature[]> = new Map([
  [FormatImage.JPEG, [{ position: 0, octets: [0xff, 0xd8, 0xff] }]],
  [
    FormatImage.PNG,
    [
      {
        position: 0,
        octets: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      },
    ],
  ],
  [
    FormatImage.WEBP,
    [
      { position: 0, octets: ascii('RIFF') },
      { position: 8, octets: ascii('WEBP') },
    ],
  ],
]);

/**
 * Contenu d'une image envoyée pour un magasin (RDC-REF-007) : au plus 5 Mo, et
 * d'un format reconnu par sa signature. Le format reconnu donne l'extension du
 * fichier stocké.
 */
export class ContenuImage {
  private constructor(
    readonly octets: Uint8Array,
    readonly format: FormatImage,
  ) {}

  static creer(octets: Uint8Array): ContenuImage {
    if (octets.length > TAILLE_MAXIMALE_IMAGE) {
      throw new ImageTropVolumineuse();
    }
    return new ContenuImage(octets, reconnaitreFormat(octets));
  }
}

function reconnaitreFormat(octets: Uint8Array): FormatImage {
  for (const [format, signatures] of SIGNATURES) {
    if (signatures.every((signature) => commencePar(octets, signature))) {
      return format;
    }
  }
  throw new ImageFormatNonSupporte();
}

function commencePar(octets: Uint8Array, signature: Signature): boolean {
  return signature.octets.every(
    (attendu, index) => octets[signature.position + index] === attendu,
  );
}
