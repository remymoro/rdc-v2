import { Email, EmailInvalide, EmailTropLong, EmailVide } from './email';

describe('Email', () => {
  it('accepte un email', () => {
    expect(Email.creer('agen@restosducoeur.org').valeur).toBe(
      'agen@restosducoeur.org',
    );
  });

  it.each(['', '   '])('refuse un email vide (%j)', (valeur) => {
    expect(() => Email.creer(valeur)).toThrow(EmailVide);
  });

  it('expose le code d’erreur de RDC v1', () => {
    expect(() => Email.creer('')).toThrow(
      expect.objectContaining({ code: 'EMAIL_EMPTY' }),
    );
  });

  it('retire les espaces en début et en fin', () => {
    expect(Email.creer('  agen@restosducoeur.org  ').valeur).toBe(
      'agen@restosducoeur.org',
    );
  });

  it('passe l’email en minuscules', () => {
    expect(Email.creer('Agen@RestosDuCoeur.ORG').valeur).toBe(
      'agen@restosducoeur.org',
    );
  });

  describe('format', () => {
    it.each(['agen@restosducoeur.org', 'prenom.nom@centre.restos.fr'])(
      'accepte %j',
      (valeur) => {
        expect(Email.creer(valeur).valeur).toBe(valeur);
      },
    );

    it.each([
      'agen', // pas de @
      'agen@restosducoeur', // pas de point dans le domaine
      '@restosducoeur.org', // rien avant le @
      'agen@@restosducoeur.org', // deux @
      'agen @restosducoeur.org', // espace
    ])('refuse %j', (valeur) => {
      expect(() => Email.creer(valeur)).toThrow(EmailInvalide);
    });

    it('expose le code d’erreur de RDC v1', () => {
      expect(() => Email.creer('agen')).toThrow(
        expect.objectContaining({ code: 'EMAIL_INVALID' }),
      );
    });
  });

  describe('longueur maximale : 254 caractères', () => {
    // 64 + 1 + (185 + 4) = 254 caractères
    const email254 = `${'a'.repeat(64)}@${'b'.repeat(185)}.org`;

    it('accepte un email de 254 caractères', () => {
      expect(Email.creer(email254).valeur).toHaveLength(254);
    });

    it('refuse un email de 255 caractères', () => {
      expect(() => Email.creer(`a${email254}`)).toThrow(EmailTropLong);
    });

    it('expose le code d’erreur de RDC v1', () => {
      expect(() => Email.creer(`a${email254}`)).toThrow(
        expect.objectContaining({ code: 'EMAIL_TOO_LONG' }),
      );
    });
  });
});
