import { Email, EmailVide } from './email';

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
});
