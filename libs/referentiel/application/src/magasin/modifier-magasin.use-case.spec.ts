import {
  Adresse,
  CentreId,
  CentreNonActif,
  CleDoublonMagasin,
  CodePostal,
  Magasin,
  MagasinArchive,
  MagasinDejaExistant,
  MagasinId,
  Nom,
  StatutCentre,
  StatutMagasin,
  Telephone,
  Ville,
} from '@rdc/referentiel-domain';
import { CentreIntrouvable, MagasinIntrouvable } from '../errors';
import { unCentreExistant } from '../testing/centre-existant.test-utils';
import { CentreRepositoryEnMemoire } from '../testing/centre-repository-en-memoire.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { unMagasinExistant } from '../testing/magasin-existant.test-utils';
import { MagasinRepositoryEnMemoire } from '../testing/magasin-repository-en-memoire.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import type { ModifierMagasinCommande } from './commandes';
import { ModifierMagasinUseCase } from './modifier-magasin.use-case';

describe('ModifierMagasinUseCase', () => {
  const maintenant = new Date('2026-10-02T14:30:00.000Z');
  const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
  const centreActuel = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');
  const autreCentre = CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b');

  let magasinRepository: MagasinRepositoryEnMemoire;
  let unitOfWork: UnitOfWorkEspion;

  function modifierMagasin(
    options: {
      magasins?: Magasin[];
      statutAutreCentre?: StatutCentre | null;
    } = {},
  ): ModifierMagasinUseCase {
    const statutAutreCentre =
      options.statutAutreCentre === undefined
        ? StatutCentre.ACTIF
        : options.statutAutreCentre;
    const centres = [unCentreExistant(centreActuel, StatutCentre.ACTIF)];
    if (statutAutreCentre !== null) {
      centres.push(unCentreExistant(autreCentre, statutAutreCentre));
    }
    magasinRepository = new MagasinRepositoryEnMemoire(
      options.magasins ?? [unMagasinExistant(magasinId, StatutMagasin.ACTIF)],
    );
    unitOfWork = new UnitOfWorkEspion();
    return new ModifierMagasinUseCase(
      magasinRepository,
      new CentreRepositoryEnMemoire(centres),
      unitOfWork,
      new HorlogeFixe(maintenant),
    );
  }

  function commande(
    surcharges: Partial<ModifierMagasinCommande> = {},
  ): ModifierMagasinCommande {
    return { magasinId, changements: {}, ...surcharges };
  }

  async function echec(
    useCase: ModifierMagasinUseCase,
    cmd: ModifierMagasinCommande,
  ): Promise<unknown> {
    return useCase.execute(cmd).then(
      () => undefined,
      (erreur: unknown) => erreur,
    );
  }

  it('enregistre les champs modifiés, datés par l’horloge, en une transaction', async () => {
    const magasin = await modifierMagasin().execute(
      commande({
        changements: {
          nom: Nom.creer('Leclerc Agen Nord'),
          telephone: Telephone.creer('05 53 11 22 33'),
        },
      }),
    );

    expect(magasin.nom.valeur).toBe('Leclerc Agen Nord');
    const enregistre = await magasinRepository.get(magasinId);
    expect(enregistre?.nom.valeur).toBe('Leclerc Agen Nord');
    expect(enregistre?.telephone?.valeur).toBe('+33553112233');
    expect(enregistre?.modifieLe).toEqual(maintenant);
    expect(unitOfWork.nombreDeCommits).toBe(1);
  });

  it('transfère le magasin vers un autre centre actif (RDC-REF-005)', async () => {
    await modifierMagasin().execute(commande({ centreId: autreCentre }));

    const enregistre = await magasinRepository.get(magasinId);
    expect(enregistre?.centreId.equals(autreCentre)).toBe(true);
  });

  it('accepte un centreId identique sans vérifier ni changer le centre', async () => {
    await modifierMagasin({ statutAutreCentre: null }).execute(
      commande({ centreId: centreActuel }),
    );

    const enregistre = await magasinRepository.get(magasinId);
    expect(enregistre?.centreId.equals(centreActuel)).toBe(true);
    expect(enregistre?.modifieLe).toEqual(new Date('2026-10-01T09:00:00.000Z'));
  });

  describe('refus, sans rien enregistrer', () => {
    it('magasin inconnu : MAGASIN_NOT_FOUND', async () => {
      const erreur = await echec(modifierMagasin({ magasins: [] }), commande());

      expect(erreur).toBeInstanceOf(MagasinIntrouvable);
      expect(unitOfWork.nombreDeCommits).toBe(0);
    });

    it('magasin archivé : MAGASIN_ARCHIVED', async () => {
      const erreur = await echec(
        modifierMagasin({
          magasins: [unMagasinExistant(magasinId, StatutMagasin.ARCHIVE)],
        }),
        commande({ changements: { nom: Nom.creer('Autre nom') } }),
      );

      expect(erreur).toBeInstanceOf(MagasinArchive);
      expect(unitOfWork.nombreDeCommits).toBe(0);
    });

    it('centre cible inconnu : CENTRE_NOT_FOUND', async () => {
      const erreur = await echec(
        modifierMagasin({ statutAutreCentre: null }),
        commande({ centreId: autreCentre }),
      );

      expect(erreur).toBeInstanceOf(CentreIntrouvable);
      expect(erreur).toMatchObject({ centreId: autreCentre });
    });

    it.each([StatutCentre.INACTIF, StatutCentre.ARCHIVE])(
      'centre cible %s : CENTRE_NON_ACTIF (RDC-REF-010)',
      async (statut) => {
        const erreur = await echec(
          modifierMagasin({ statutAutreCentre: statut }),
          commande({ centreId: autreCentre }),
        );

        expect(erreur).toBeInstanceOf(CentreNonActif);
        expect(
          (await magasinRepository.get(magasinId))?.centreId.equals(
            centreActuel,
          ),
        ).toBe(true);
        expect(unitOfWork.nombreDeCommits).toBe(0);
      },
    );

    it('doublon d’un autre magasin après modification : MAGASIN_ALREADY_EXISTS', async () => {
      const autre = Magasin.creer(
        {
          id: MagasinId.creer('5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c'),
          nom: Nom.creer('Leclerc Agen Nord'),
          adresse: Adresse.creer('1 avenue du Général de Gaulle'),
          codePostal: CodePostal.creer('47000'),
          ville: Ville.creer('Agen'),
          centreId: centreActuel,
        },
        maintenant,
      );
      const useCase = modifierMagasin({
        magasins: [unMagasinExistant(magasinId, StatutMagasin.ACTIF), autre],
      });

      const erreur = await echec(
        useCase,
        commande({ changements: { nom: Nom.creer('LECLERC AGEN-NORD') } }),
      );

      expect(erreur).toBeInstanceOf(MagasinDejaExistant);
      expect(magasinRepository.clesDemandees[0]).toBeInstanceOf(
        CleDoublonMagasin,
      );
      expect((await magasinRepository.get(magasinId))?.nom.valeur).toBe(
        'Leclerc Agen Sud',
      );
      expect(unitOfWork.nombreDeCommits).toBe(0);
    });
  });

  it('ne se considère pas lui-même comme un doublon (même clé, autre écriture)', async () => {
    await modifierMagasin().execute(
      commande({ changements: { nom: Nom.creer('LECLERC AGEN-SUD') } }),
    );

    expect((await magasinRepository.get(magasinId))?.nom.valeur).toBe(
      'LECLERC AGEN-SUD',
    );
    expect(unitOfWork.nombreDeCommits).toBe(1);
  });
});
