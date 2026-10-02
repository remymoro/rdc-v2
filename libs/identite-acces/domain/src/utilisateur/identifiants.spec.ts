import {
  CentreId,
  CentreIdInvalide,
  CentreIdVide,
  UtilisateurId,
  UtilisateurIdInvalide,
  UtilisateurIdVide,
} from './identifiants';

describe('UtilisateurId', () => {
  const uuid = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';

  it('retire les espaces et passe en minuscules', () => {
    expect(UtilisateurId.creer(`  ${uuid.toUpperCase()} `).valeur).toBe(uuid);
  });

  it('rend égales deux écritures du même identifiant', () => {
    expect(
      UtilisateurId.creer(uuid.toUpperCase()).equals(UtilisateurId.creer(uuid)),
    ).toBe(true);
  });

  it('refuse un identifiant vide (UTILISATEUR_ID_EMPTY)', () => {
    expect(() => UtilisateurId.creer('  ')).toThrow(UtilisateurIdVide);
    expect(() => UtilisateurId.creer('')).toThrow(
      expect.objectContaining({ code: 'UTILISATEUR_ID_EMPTY' }),
    );
  });

  it.each(['abc', '3b8a5d6e0f124f7a9c1e7f1c9d7e2d4b'])(
    'refuse un identifiant qui n’est pas un UUID (%j, UTILISATEUR_ID_INVALID)',
    (valeur) => {
      expect(() => UtilisateurId.creer(valeur)).toThrow(UtilisateurIdInvalide);
      expect(() => UtilisateurId.creer(valeur)).toThrow(
        expect.objectContaining({ code: 'UTILISATEUR_ID_INVALID' }),
      );
    },
  );
});

describe('CentreId (référence locale au centre d’un compte)', () => {
  const uuid = '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12';

  it('normalise et compare comme l’identifiant du référentiel', () => {
    expect(
      CentreId.creer(` ${uuid.toUpperCase()}`).equals(CentreId.creer(uuid)),
    ).toBe(true);
  });

  it('reprend les codes d’erreur du référentiel', () => {
    expect(() => CentreId.creer('')).toThrow(CentreIdVide);
    expect(() => CentreId.creer('abc')).toThrow(
      expect.objectContaining({ code: 'CENTRE_ID_INVALID' }),
    );
    expect(() => CentreId.creer('abc')).toThrow(CentreIdInvalide);
  });
});
