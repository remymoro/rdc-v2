import { Centre, StatutCentre } from '@rdc/referentiel-domain';
import type { Prisma } from '@rdc/shared-kernel-adapters';
import { versCentre, versLigneCentre } from './centre.mapper';

// Filet local du mapper : la suite de contrat Prisma demande PostgreSQL.
describe('mapper Centre ↔ ligne Prisma', () => {
  function uneLigne(surcharges: Partial<Prisma.CentreModel> = {}) {
    return {
      id: '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
      nom: "Centre d'Agen",
      adresse: '12 avenue Jean Jaurès',
      codePostal: '47000',
      ville: 'Agen',
      telephone: '+33553000000',
      email: 'agen@restosducoeur.org',
      statut: 'INACTIF',
      createdAt: new Date('2026-10-01T09:00:00.000Z'),
      updatedAt: new Date('2026-10-02T14:30:00.000Z'),
      cleDoublon: null,
      ...surcharges,
    } satisfies Prisma.CentreModel;
  }

  it('reconstitue le centre avec son statut et ses dates', () => {
    const centre = versCentre(uneLigne());

    expect(centre).toBeInstanceOf(Centre);
    expect(centre.statut).toBe(StatutCentre.INACTIF);
    expect(centre.creeLe).toEqual(new Date('2026-10-01T09:00:00.000Z'));
    expect(centre.modifieLe).toEqual(new Date('2026-10-02T14:30:00.000Z'));
  });

  it.each(['ACTIF', 'INACTIF', 'ARCHIVE'] as const)(
    'fait l’aller-retour d’un centre %s sans perte',
    (statut) => {
      const ligne = uneLigne({ statut });

      const { cleDoublon: _cle, ...relue } = versLigneCentre(versCentre(ligne));

      const { cleDoublon: _attendue, ...attendue } = ligne;
      expect(relue).toEqual(attendue);
    },
  );

  it('traduit un téléphone ou un email absent par undefined', () => {
    const centre = versCentre(uneLigne({ telephone: null, email: null }));

    expect(centre.telephone).toBeUndefined();
    expect(centre.email).toBeUndefined();
  });
});
