import {
  AdresseConnexion,
  AdresseConnexionInvalide,
  AdresseConnexionTropLongue,
  AdresseConnexionVide,
} from './adresse-connexion';

describe('AdresseConnexion (RDC-ACCES-010)', () => {
  it('retire les espaces et passe en minuscules : une adresse, une seule écriture', () => {
    expect(
      AdresseConnexion.creer('  AD47.Fumel1@RestosDuCoeur.org ').valeur,
    ).toBe('ad47.fumel1@restosducoeur.org');
  });

  it('rend égales deux écritures de la même adresse', () => {
    expect(
      AdresseConnexion.creer('Siege@ad47.org').equals(
        AdresseConnexion.creer('siege@ad47.org'),
      ),
    ).toBe(true);
  });

  it('refuse une adresse vide (EMAIL_EMPTY, code v1)', () => {
    expect(() => AdresseConnexion.creer('   ')).toThrow(AdresseConnexionVide);
    expect(() => AdresseConnexion.creer('')).toThrow(
      expect.objectContaining({
        code: 'EMAIL_EMPTY',
        name: 'AdresseConnexionVide',
      }),
    );
  });

  it.each(['siege', 'siege@ad47', 'si ege@ad47.org', '@ad47.org'])(
    'refuse une adresse sans la forme x@y.z (%j, EMAIL_INVALID, code v1)',
    (valeur) => {
      expect(() => AdresseConnexion.creer(valeur)).toThrow(
        AdresseConnexionInvalide,
      );
      expect(() => AdresseConnexion.creer(valeur)).toThrow(
        expect.objectContaining({
          code: 'EMAIL_INVALID',
          name: 'AdresseConnexionInvalide',
        }),
      );
    },
  );

  it('refuse plus de 254 caractères (EMAIL_TOO_LONG, code v1)', () => {
    const adresse = `${'a'.repeat(245)}@ad47.org`; // 254 caractères
    expect(AdresseConnexion.creer(adresse).valeur).toHaveLength(254);
    expect(() => AdresseConnexion.creer(`a${adresse}`)).toThrow(
      AdresseConnexionTropLongue,
    );
    expect(() => AdresseConnexion.creer(`a${adresse}`)).toThrow(
      expect.objectContaining({
        code: 'EMAIL_TOO_LONG',
        name: 'AdresseConnexionTropLongue',
      }),
    );
  });

  it('refuse à la compilation un objet qui imite une adresse sans être validé', () => {
    // @ts-expect-error : un objet littéral n'est pas une AdresseConnexion.
    const imitation: AdresseConnexion = { valeur: 'x', equals: () => true };
    expect(imitation).toBeDefined();
  });
});
