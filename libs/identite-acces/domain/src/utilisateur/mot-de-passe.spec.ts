import {
  MotDePasse,
  MotDePasseHache,
  MotDePasseHacheInvalide,
  MotDePasseTropCourt,
  MotDePasseTropLong,
} from './mot-de-passe';

describe('MotDePasse (RDC-ACCES-007, audit A-06)', () => {
  it('accepte 12 caractères, le minimum repris de la v1', () => {
    expect(MotDePasse.creer('a'.repeat(12)).valeur).toHaveLength(12);
  });

  it('refuse moins de 12 caractères (MOT_DE_PASSE_TROP_COURT)', () => {
    expect(() => MotDePasse.creer('a'.repeat(11))).toThrow(MotDePasseTropCourt);
    expect(() => MotDePasse.creer('court')).toThrow(
      expect.objectContaining({
        code: 'MOT_DE_PASSE_TROP_COURT',
        name: 'MotDePasseTropCourt',
      }),
    );
  });

  it('accepte 128 caractères et refuse au-delà : un hachage lent ne reçoit jamais un texte géant', () => {
    expect(MotDePasse.creer('a'.repeat(128)).valeur).toHaveLength(128);
    expect(() => MotDePasse.creer('a'.repeat(129))).toThrow(MotDePasseTropLong);
    expect(() => MotDePasse.creer('a'.repeat(129))).toThrow(
      expect.objectContaining({ code: 'MOT_DE_PASSE_TROP_LONG' }),
    );
  });

  it('garde le mot de passe tel quel : les espaces comptent', () => {
    expect(MotDePasse.creer('  douze carac ').valeur).toBe('  douze carac ');
  });

  it('ne se montre jamais en clair dans un message ou un journal', () => {
    const motDePasse = MotDePasse.creer('secret-tres-long');
    expect(String(motDePasse)).not.toContain('secret');
    expect(JSON.stringify({ motDePasse })).not.toContain('secret');
  });
});

describe('MotDePasseHache', () => {
  it('garde l’empreinte telle quelle', () => {
    const empreinte = 'scrypt$sel-de-16-octets$empreinte';
    expect(MotDePasseHache.creer(empreinte).valeur).toBe(empreinte);
  });

  it.each(['  ', 'x'.repeat(19)])(
    'refuse une empreinte vide ou de moins de 20 caractères (%j, PASSWORD_HASH_INVALID, code v1)',
    (valeur) => {
      expect(() => MotDePasseHache.creer(valeur)).toThrow(
        MotDePasseHacheInvalide,
      );
      expect(() => MotDePasseHache.creer(valeur)).toThrow(
        expect.objectContaining({
          code: 'PASSWORD_HASH_INVALID',
          name: 'MotDePasseHacheInvalide',
        }),
      );
    },
  );

  it('ne se montre jamais dans un message ou un journal', () => {
    const empreinte = MotDePasseHache.creer('scrypt$sel$valeur-secrete');
    expect(String(empreinte)).not.toContain('valeur-secrete');
    expect(JSON.stringify({ empreinte })).not.toContain('valeur-secrete');
  });
});

describe('types distincts : le mot de passe en clair n’est jamais pris pour son empreinte', () => {
  it('refuse à la compilation un mot de passe en clair là où une empreinte est attendue', () => {
    // @ts-expect-error : MotDePasse n'est pas un MotDePasseHache.
    const empreinte: MotDePasseHache = MotDePasse.creer('a'.repeat(12));
    // @ts-expect-error : MotDePasseHache n'est pas un MotDePasse.
    const enClair: MotDePasse = MotDePasseHache.creer('x'.repeat(20));
    expect([empreinte, enClair]).toHaveLength(2);
  });
});
