import {
  Adresse,
  CentreId,
  CodePostal,
  Nom,
  StatutCentre,
  Ville,
} from '@rdc/referentiel-domain';
import type { CreerCentreCommande } from '../commands';
import { CentreRepositoryEnMemoire } from '../testing/centre-repository-en-memoire.test-utils';
import { GenerateurIdentifiantsFixe } from '../testing/generateur-identifiants-fixe.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { UnitOfWorkEspion } from '../testing/unit-of-work-espion.test-utils';
import { CreerCentreUseCase } from './creer-centre.use-case';

describe('CreerCentreUseCase', () => {
  const maintenant = new Date('2026-10-01T09:00:00.000Z');
  const idGenere = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');

  let centreRepository: CentreRepositoryEnMemoire;
  let unitOfWork: UnitOfWorkEspion;
  let creerCentre: CreerCentreUseCase;

  beforeEach(() => {
    centreRepository = new CentreRepositoryEnMemoire();
    unitOfWork = new UnitOfWorkEspion();
    creerCentre = new CreerCentreUseCase(
      centreRepository,
      new GenerateurIdentifiantsFixe(idGenere),
      unitOfWork,
      new HorlogeFixe(maintenant),
    );
  });

  function commande(): CreerCentreCommande {
    return {
      nom: Nom.creer("Centre d'Agen"),
      adresse: Adresse.creer('12 avenue Jean Jaurès'),
      codePostal: CodePostal.creer('47000'),
      ville: Ville.creer('Agen'),
    };
  }

  it("crée un centre ACTIF avec l'identifiant généré et la date de l'horloge", async () => {
    const centre = await creerCentre.execute(commande());

    expect(centre.id.equals(idGenere)).toBe(true);
    expect(centre.statut).toBe(StatutCentre.ACTIF);
    expect(centre.creeLe).toEqual(maintenant);
  });

  it('enregistre le centre créé', async () => {
    const centre = await creerCentre.execute(commande());

    expect(centreRepository.centresEnregistres()).toEqual([centre]);
  });

  it('valide la transaction une seule fois', async () => {
    await creerCentre.execute(commande());

    expect(unitOfWork.nombreDeCommits).toBe(1);
  });
});
