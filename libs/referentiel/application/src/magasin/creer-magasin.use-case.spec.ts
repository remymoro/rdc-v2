import {
  Adresse,
  CentreId,
  CentreNonActif,
  CleDoublonMagasin,
  CodePostal,
  Magasin,
  MagasinDejaExistant,
  MagasinId,
  Nom,
  StatutCentre,
  StatutMagasin,
  Ville,
} from '@rdc/referentiel-domain';
import type { CreerMagasinCommande } from './commandes';
import { CentreIntrouvable } from '../errors';
import { CentreRepositoryEnMemoire } from '../testing/centre-repository-en-memoire.test-utils';
import { unCentreExistant } from '../testing/centre-existant.test-utils';
import { GenerateurIdentifiantsFixe } from '../testing/generateur-identifiants-fixe.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { MagasinRepositoryEnMemoire } from '../testing/magasin-repository-en-memoire.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import { CreerMagasinUseCase } from './creer-magasin.use-case';

describe('CreerMagasinUseCase', () => {
  const maintenant = new Date('2026-10-01T09:00:00.000Z');
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');
  const idGenere = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');

  let magasinRepository: MagasinRepositoryEnMemoire;
  let unitOfWork: UnitOfWorkEspion;

  function creerMagasin(
    statutCentre: StatutCentre | null = StatutCentre.ACTIF,
    magasinsExistants: Magasin[] = [],
  ): CreerMagasinUseCase {
    const centres =
      statutCentre === null ? [] : [unCentreExistant(centreId, statutCentre)];
    magasinRepository = new MagasinRepositoryEnMemoire(magasinsExistants);
    unitOfWork = new UnitOfWorkEspion();
    return new CreerMagasinUseCase(
      magasinRepository,
      new CentreRepositoryEnMemoire(centres),
      new GenerateurIdentifiantsFixe({ centreId, magasinId: idGenere }),
      unitOfWork,
      new HorlogeFixe(maintenant),
    );
  }

  function commande(): CreerMagasinCommande {
    return {
      nom: Nom.creer('Leclerc Agen Sud'),
      adresse: Adresse.creer('1 avenue du Général de Gaulle'),
      codePostal: CodePostal.creer('47000'),
      ville: Ville.creer('Agen'),
      centreId,
    };
  }

  it("crée un magasin ACTIF rattaché au centre, avec l'identifiant généré et la date de l'horloge", async () => {
    const magasin = await creerMagasin().execute(commande());

    expect(magasin.id.equals(idGenere)).toBe(true);
    expect(magasin.centreId.equals(centreId)).toBe(true);
    expect(magasin.statut).toBe(StatutMagasin.ACTIF);
    expect(magasin.creeLe).toEqual(maintenant);
  });

  it('enregistre le magasin et valide la transaction une seule fois', async () => {
    const magasin = await creerMagasin().execute(commande());

    expect(magasinRepository.magasinsEnregistres()).toEqual([magasin]);
    expect(unitOfWork.nombreDeCommits).toBe(1);
  });

  describe('refus', () => {
    async function echec(useCase: CreerMagasinUseCase): Promise<unknown> {
      return useCase.execute(commande()).then(
        () => undefined,
        (erreur: unknown) => erreur,
      );
    }

    it('refuse un centre inconnu (CENTRE_NOT_FOUND)', async () => {
      const erreur = await echec(creerMagasin(null));

      expect(erreur).toBeInstanceOf(CentreIntrouvable);
      expect(erreur).toMatchObject({ code: 'CENTRE_NOT_FOUND', centreId });
    });

    it.each([StatutCentre.INACTIF, StatutCentre.ARCHIVE])(
      'refuse un centre %s (CENTRE_NON_ACTIF, RDC-REF-010)',
      async (statut) => {
        const erreur = await echec(creerMagasin(statut));

        expect(erreur).toBeInstanceOf(CentreNonActif);
        expect(erreur).toMatchObject({ code: 'CENTRE_NON_ACTIF' });
      },
    );

    describe('doublon (même nom, adresse, code postal et ville)', () => {
      /** Même magasin que commande(), saisi autrement, dans un autre centre. */
      const magasinExistant = Magasin.creer(
        {
          id: MagasinId.creer('5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c'),
          nom: Nom.creer('LECLERC AGEN-SUD'),
          adresse: Adresse.creer('1 avenue du General de Gaulle'),
          codePostal: CodePostal.creer('47000'),
          ville: Ville.creer('AGEN'),
          centreId: CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b'),
        },
        new Date('2025-01-15T10:00:00.000Z'),
      );

      it('est refusé avec MAGASIN_ALREADY_EXISTS, même dans un autre centre', async () => {
        const erreur = await echec(
          creerMagasin(StatutCentre.ACTIF, [magasinExistant]),
        );

        expect(erreur).toBeInstanceOf(MagasinDejaExistant);
        expect(erreur).toMatchObject({ code: 'MAGASIN_ALREADY_EXISTS' });
      });

      it('interroge le repository avec la clé de doublon, pas avec des chaînes', async () => {
        await echec(creerMagasin(StatutCentre.ACTIF, [magasinExistant]));

        const [cle] = magasinRepository.clesDemandees;
        expect(cle).toBeInstanceOf(CleDoublonMagasin);
        expect(cle?.equals(CleDoublonMagasin.depuis(commande()))).toBe(true);
      });
    });

    it.each([
      ['centre inconnu', null],
      ['centre inactif', StatutCentre.INACTIF],
    ] as const)(
      "n'enregistre rien et ne valide aucune transaction (%s)",
      async (_cas, statut) => {
        await echec(creerMagasin(statut));

        expect(magasinRepository.magasinsEnregistres()).toEqual([]);
        expect(unitOfWork.nombreDeCommits).toBe(0);
      },
    );
  });
});
