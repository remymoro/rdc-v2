import {
  AdresseAbreviationInterdite,
  Magasin,
  StatutMagasin,
  TelephoneInvalide,
} from '@rdc/referentiel-domain';
import type { Prisma } from '@rdc/shared-kernel-adapters';
import { MagasinPersisteInvalide } from './magasin-persiste-invalide';
import { versLigneMagasin, versMagasin } from './magasin.mapper';

// Filet local du mapper : la suite de contrat Prisma demande PostgreSQL.
describe('mapper Magasin ↔ ligne Prisma', () => {
  function uneLigne(surcharges: Partial<Prisma.MagasinModel> = {}) {
    return {
      id: '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b',
      nom: 'Leclerc Agen Sud',
      adresse: '1 avenue du Général de Gaulle',
      codePostal: '47000',
      ville: 'Agen',
      telephone: '+33553987654',
      email: 'agen-sud@leclerc.fr',
      statut: 'INACTIF',
      centreId: '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
      createdAt: new Date('2026-10-01T09:00:00.000Z'),
      updatedAt: new Date('2026-10-02T14:30:00.000Z'),
      cleDoublon: null,
      ...surcharges,
    } satisfies Prisma.MagasinModel;
  }

  it('reconstitue le magasin avec son centre, son statut et ses dates', () => {
    const magasin = versMagasin(uneLigne());

    expect(magasin).toBeInstanceOf(Magasin);
    expect(magasin.centreId.valeur).toBe(
      '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
    );
    expect(magasin.statut).toBe(StatutMagasin.INACTIF);
    expect(magasin.creeLe).toEqual(new Date('2026-10-01T09:00:00.000Z'));
    expect(magasin.modifieLe).toEqual(new Date('2026-10-02T14:30:00.000Z'));
  });

  it.each(['ACTIF', 'INACTIF', 'ARCHIVE'] as const)(
    'fait l’aller-retour d’un magasin %s sans perte',
    (statut) => {
      const ligne = uneLigne({ statut });

      const { cleDoublon: _cle, ...relue } = versLigneMagasin(
        versMagasin(ligne),
      );

      const { cleDoublon: _attendue, ...attendue } = ligne;
      expect(relue).toEqual(attendue);
    },
  );

  it('écrit la clé de doublon du magasin', () => {
    const ligne = versLigneMagasin(versMagasin(uneLigne()));

    expect(ligne.cleDoublon).toBe(
      'LECLERCAGENSUD|AGEN|47000|1AVENUEDUGENERALDEGAULLE',
    );
  });

  it('traduit un téléphone ou un email absent par undefined', () => {
    const magasin = versMagasin(uneLigne({ telephone: null, email: null }));

    expect(magasin.telephone).toBeUndefined();
    expect(magasin.email).toBeUndefined();
  });

  // Lignes v1 non reprises (ADR-0008) : échec explicite de l'adapter, pas une
  // erreur de saisie (TENETS-VALUE-003, ERROR-005).
  it.each([
    ['un téléphone en 08', { telephone: '0812345678' }, TelephoneInvalide],
    [
      'une adresse abrégée',
      { adresse: '1 av du Général de Gaulle' },
      AdresseAbreviationInterdite,
    ],
  ] as const)(
    'refuse une ligne avec %s par MagasinPersisteInvalide en gardant la cause',
    (_cas, surcharges, causeAttendue) => {
      const ligne = uneLigne(surcharges);

      let erreur: unknown;
      try {
        versMagasin(ligne);
      } catch (e) {
        erreur = e;
      }

      expect(erreur).toBeInstanceOf(MagasinPersisteInvalide);
      const echec = erreur as MagasinPersisteInvalide;
      expect(echec.idLigne).toBe(ligne.id);
      expect(echec.code).toBe('MAGASIN_PERSISTED_INVALID');
      expect(echec.cause).toBeInstanceOf(causeAttendue);
      expect(echec.message).not.toContain(ligne.adresse);
      expect(echec.message).not.toContain(ligne.telephone);
    },
  );
});
