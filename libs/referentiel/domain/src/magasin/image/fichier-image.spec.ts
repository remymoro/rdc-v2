import { FichierImage, FichierImageInvalide } from './fichier-image';

describe('FichierImage', () => {
  it('accepte un nom UUID suivi d’une extension', () => {
    expect(
      FichierImage.creer('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.jpg').valeur,
    ).toBe('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.jpg');
  });

  it('accepte l’extension d’une image reprise de la v1 (ADR-0008)', () => {
    expect(
      FichierImage.creer('0D4E2B8C-6A1F-4C3E-9B7D-5F2A8E1C4B6D.JPEG').valeur,
    ).toBe('0D4E2B8C-6A1F-4C3E-9B7D-5F2A8E1C4B6D.JPEG');
  });

  it.each([
    'x./../evil', // audit A-18 : nom forgé par le client
    '../0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.jpg',
    '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.jpg/../../evil',
    '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d',
    'photo.jpg',
    '',
  ])('refuse un nom de fichier hors format (%j)', (nom) => {
    expect(() => FichierImage.creer(nom)).toThrow(FichierImageInvalide);
  });

  it('compare par valeur', () => {
    const nom = '0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d.png';
    expect(FichierImage.creer(nom).equals(FichierImage.creer(nom))).toBe(true);
  });
});
