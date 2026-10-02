import {
  CentreDejaExistant,
  Adresse,
  Centre,
  CentreArchive,
  CentreId,
  CleDoublonCentre,
  CodePostal,
  Email,
  Nom,
  StatutCentre,
  Ville,
} from '@rdc/referentiel-domain';
import { CentreIntrouvable } from '../errors';
import { unCentreExistant } from '../testing/centre-existant.test-utils';
import { CentreRepositoryEnMemoire } from '../testing/centre-repository-en-memoire.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import type { ModifierCentreCommande } from './commandes';
import { ModifierCentreUseCase } from './modifier-centre.use-case';

describe('ModifierCentreUseCase', () => {
  const maintenant = new Date('2026-10-02T14:30:00.000Z');
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');
  const boeId = CentreId.creer('0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b');

  /** Un autre centre existant : « Centre de Boé », à une autre adresse. */
  const centreDeBoe = Centre.reconstituer({
    id: boeId,
    nom: Nom.creer('Centre de Boé'),
    adresse: Adresse.creer('3 avenue de la Liberté'),
    codePostal: CodePostal.creer('47550'),
    ville: Ville.creer('Boé'),
    statut: StatutCentre.ACTIF,
    creeLe: new Date('2026-10-01T09:00:00.000Z'),
    modifieLe: new Date('2026-10-01T09:00:00.000Z'),
  });

  let centreRepository: CentreRepositoryEnMemoire;
  let unitOfWork: UnitOfWorkEspion;

  function modifierCentre(
    statut: StatutCentre = StatutCentre.ACTIF,
  ): ModifierCentreUseCase {
    centreRepository = new CentreRepositoryEnMemoire([
      unCentreExistant(centreId, statut),
      centreDeBoe,
    ]);
    unitOfWork = new UnitOfWorkEspion();
    return new ModifierCentreUseCase(
      centreRepository,
      unitOfWork,
      new HorlogeFixe(maintenant),
    );
  }

  function commande(
    changements: ModifierCentreCommande['changements'],
    id: CentreId = centreId,
  ): ModifierCentreCommande {
    return { centreId: id, changements };
  }

  async function echec(
    useCase: ModifierCentreUseCase,
    cmd: ModifierCentreCommande,
  ): Promise<unknown> {
    return useCase.execute(cmd).then(
      () => undefined,
      (erreur: unknown) => erreur,
    );
  }

  it('enregistre les champs modifiés, datés par l’horloge, en une transaction', async () => {
    const centre = await modifierCentre().execute(
      commande({
        nom: Nom.creer("Centre d'Agen Nord"),
        email: Email.creer('agen-nord@restosducoeur.org'),
      }),
    );

    expect(centre.nom.valeur).toBe("Centre d'Agen Nord");
    const enregistre = await centreRepository.get(centreId);
    expect(enregistre?.nom.valeur).toBe("Centre d'Agen Nord");
    expect(enregistre?.email?.valeur).toBe('agen-nord@restosducoeur.org');
    expect(enregistre?.modifieLe).toEqual(maintenant);
    expect(unitOfWork.nombreDeCommits).toBe(1);
  });

  it('modifie un centre inactif', async () => {
    await modifierCentre(StatutCentre.INACTIF).execute(
      commande({ ville: Ville.creer('Le Passage') }),
    );

    expect((await centreRepository.get(centreId))?.ville.valeur).toBe(
      'Le Passage',
    );
  });

  it('cherche un doublon avec la nouvelle clé quand elle change (TENETS-TEST-006)', async () => {
    const centre = await modifierCentre().execute(
      commande({ adresse: Adresse.creer('14 avenue Jean Jaurès') }),
    );

    expect(centreRepository.clesDemandees).toEqual([
      CleDoublonCentre.depuis(centre),
    ]);
    expect(centreRepository.clesDemandees[0]).toBeInstanceOf(CleDoublonCentre);
  });

  it('ne cherche pas de doublon quand la clé ne change pas (contacts seuls)', async () => {
    await modifierCentre().execute(commande({ telephone: null }));

    expect(centreRepository.clesDemandees).toEqual([]);
  });

  it('accepte une autre écriture de sa propre clé (casse, accents)', async () => {
    await modifierCentre().execute(
      commande({ nom: Nom.creer("CENTRE D'AGEN") }),
    );

    expect((await centreRepository.get(centreId))?.nom.valeur).toBe(
      "CENTRE D'AGEN",
    );
  });

  describe('refus, sans rien enregistrer', () => {
    it('centre inconnu : CENTRE_NOT_FOUND', async () => {
      const inconnu = CentreId.creer('1c7f4a8b-0d3e-4f2a-9b6c-7d8e9f0a1b2c');

      const erreur = await echec(modifierCentre(), commande({}, inconnu));

      expect(erreur).toBeInstanceOf(CentreIntrouvable);
      expect(unitOfWork.nombreDeCommits).toBe(0);
    });

    it('centre archivé : CENTRE_ARCHIVED (RDC-REF-002)', async () => {
      const erreur = await echec(
        modifierCentre(StatutCentre.ARCHIVE),
        commande({ nom: Nom.creer('Centre de Layrac') }),
      );

      expect(erreur).toBeInstanceOf(CentreArchive);
      expect((await centreRepository.get(centreId))?.nom.valeur).toBe(
        "Centre d'Agen",
      );
      expect(unitOfWork.nombreDeCommits).toBe(0);
    });

    it('même nom et même adresse qu’un autre centre : CENTRE_ALREADY_EXISTS (RDC-REF-001)', async () => {
      const erreur = await echec(
        modifierCentre(),
        commande({
          nom: Nom.creer('centre de boe'),
          adresse: Adresse.creer('3 avenue de la Liberté'),
          codePostal: CodePostal.creer('47550'),
          ville: Ville.creer('Boé'),
        }),
      );

      expect(erreur).toBeInstanceOf(CentreDejaExistant);
      expect((await centreRepository.get(centreId))?.nom.valeur).toBe(
        "Centre d'Agen",
      );
      expect(unitOfWork.nombreDeCommits).toBe(0);
    });
  });
});
