import {
  Adresse,
  AdresseAbreviationInterdite,
  AdresseTropLongue,
  AdresseVide,
} from './adresse';

describe('Adresse', () => {
  it('accepte une adresse', () => {
    expect(Adresse.creer('12 avenue Jean Jaurès').valeur).toBe(
      '12 avenue Jean Jaurès',
    );
  });

  it.each(['', '   '])('refuse une adresse vide (%j)', (valeur) => {
    expect(() => Adresse.creer(valeur)).toThrow(AdresseVide);
  });

  it('expose le code d’erreur de RDC v1', () => {
    expect(() => Adresse.creer('')).toThrow(
      expect.objectContaining({ code: 'ADRESSE_EMPTY' }),
    );
  });

  describe('espaces', () => {
    it('sont retirés en début et en fin', () => {
      expect(Adresse.creer('  12 avenue Jean Jaurès  ').valeur).toBe(
        '12 avenue Jean Jaurès',
      );
    });

    it('sont réduits à un seul à l’intérieur', () => {
      expect(Adresse.creer('12  avenue \t Jean   Jaurès').valeur).toBe(
        '12 avenue Jean Jaurès',
      );
    });

    it('sont normalisés avant de mesurer la longueur', () => {
      const adresse = Adresse.creer(
        `  ${'a'.repeat(127)}     ${'b'.repeat(127)}  `,
      );
      expect(adresse.valeur).toHaveLength(255);
    });
  });

  describe('longueur maximale : 255 caractères', () => {
    it('accepte une adresse de 255 caractères', () => {
      expect(Adresse.creer('a'.repeat(255)).valeur).toHaveLength(255);
    });

    it('refuse une adresse de 256 caractères', () => {
      expect(() => Adresse.creer('a'.repeat(256))).toThrow(AdresseTropLongue);
    });

    it('expose le code d’erreur de RDC v1', () => {
      expect(() => Adresse.creer('a'.repeat(256))).toThrow(
        expect.objectContaining({ code: 'ADRESSE_TOO_LONG' }),
      );
    });
  });

  // Règle de RDC v1 reprise à l'identique (ADR-0006).
  describe('abréviations de voie interdites', () => {
    it.each([
      ['AV', 'Avenue'],
      ['AVE', 'Avenue'],
      ['BD', 'Boulevard'],
      ['BLVD', 'Boulevard'],
      ['RTE', 'Route'],
      ['IMP', 'Impasse'],
      ['ALL', 'Allée'],
      ['SQ', 'Square'],
      ['FG', 'Faubourg'],
      ['PL', 'Place'],
      ['ESP', 'Esplanade'],
      ['PASS', 'Passage'],
      ['VLA', 'Villa'],
      ['RES', 'Résidence'],
      ['RESID', 'Résidence'],
      ['CHE', 'Chemin'],
      ['CRS', 'Cours'],
      ['HAM', 'Hameau'],
      ['LOT', 'Lotissement'],
    ])('refuse %s et propose « %s »', (abreviation, formeComplete) => {
      expect(() => Adresse.creer(`12 ${abreviation} Jean Jaurès`)).toThrow(
        expect.objectContaining({ abreviation, formeComplete }),
      );
    });

    it.each([
      '12 av. Jean Jaurès', // minuscules et point
      '12 Bd Voltaire', // casse mixte
      '3 bd.Voltaire', // point collé au mot suivant
      '5,rte de Paris', // virgule
      "7 all'Est", // apostrophe
    ])(
      'reconnaît l’abréviation quels que soient casse et séparateurs (%j)',
      (valeur) => {
        expect(() => Adresse.creer(valeur)).toThrow(
          AdresseAbreviationInterdite,
        );
      },
    );

    it('conserve l’abréviation telle que saisie dans l’erreur', () => {
      expect(() => Adresse.creer('12 av. Jean Jaurès')).toThrow(
        expect.objectContaining({ abreviation: 'av', formeComplete: 'Avenue' }),
      );
    });

    it('accepte un mot qui contient une abréviation sans en être une', () => {
      expect(Adresse.creer('12 avenue Lavoisier').valeur).toBe(
        '12 avenue Lavoisier',
      );
    });

    it('refuse « rue du Lot » : limite connue, voulue (ADR-0006)', () => {
      expect(() => Adresse.creer('12 rue du Lot')).toThrow(
        AdresseAbreviationInterdite,
      );
    });

    it('expose le code d’erreur de RDC v1', () => {
      expect(() => Adresse.creer('12 AV Jean Jaurès')).toThrow(
        expect.objectContaining({ code: 'ADRESSE_ABREVIATION_INTERDITE' }),
      );
    });
  });
});
