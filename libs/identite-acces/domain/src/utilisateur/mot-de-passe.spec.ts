import {
  MotDePasse,
  MotDePasseHache,
  MotDePasseHacheVide,
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
      expect.objectContaining({ code: 'MOT_DE_PASSE_TROP_COURT' }),
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
    expect(MotDePasseHache.creer('scrypt$abc$def').valeur).toBe(
      'scrypt$abc$def',
    );
  });

  it('refuse une empreinte vide (MOT_DE_PASSE_HACHE_VIDE)', () => {
    expect(() => MotDePasseHache.creer('  ')).toThrow(MotDePasseHacheVide);
  });

  it('ne se montre jamais dans un message ou un journal', () => {
    const empreinte = MotDePasseHache.creer('scrypt$sel$valeur-secrete');
    expect(String(empreinte)).not.toContain('valeur-secrete');
    expect(JSON.stringify({ empreinte })).not.toContain('valeur-secrete');
  });
});
