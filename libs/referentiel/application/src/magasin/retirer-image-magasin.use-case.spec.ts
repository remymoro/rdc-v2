import {
  FichierImage,
  ImageMagasin,
  ImageMagasinId,
  Magasin,
  MagasinId,
  MagasinImageIntrouvable,
  StatutMagasin,
} from '@rdc/referentiel-domain';
import { MagasinIntrouvable } from '../errors';
import { StockageImagesIndisponible } from '../ports/stockage-images';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { JournalEnMemoire } from '../testing/journal-en-memoire.test-utils';
import { unMagasinExistant } from '../testing/magasin-existant.test-utils';
import { MagasinRepositoryEnMemoire } from '../testing/magasin-repository-en-memoire.test-utils';
import { StockageImagesEnMemoire } from '../testing/stockage-images-en-memoire.test-utils';
import {
  UnitOfWorkEspion,
  UnitOfWorkQuiEchoueAuCommit,
} from '../testing/unit-of-work-espion.test-utils';
import { RetirerImageMagasinUseCase } from './retirer-image-magasin.use-case';

describe('RetirerImageMagasinUseCase (RDC-REF-007)', () => {
  const maintenant = new Date('2026-10-02T14:30:00.000Z');
  const ajouteeLe = new Date('2026-10-01T10:00:00.000Z');
  const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
  const imageId = ImageMagasinId.creer('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d');
  const fichier = FichierImage.creer(`${imageId.valeur}.jpg`);
  const cheminFichier = `${magasinId.valeur}/${fichier.valeur}`;

  let magasinRepository: MagasinRepositoryEnMemoire;
  let stockage: StockageImagesEnMemoire;
  let journal: JournalEnMemoire;
  let unitOfWork: UnitOfWorkEspion;

  /** Un magasin en base avec une image, et son fichier sur le stockage. */
  function unMagasinAvecImage(): Magasin {
    const existant = unMagasinExistant(magasinId, StatutMagasin.ACTIF);
    return Magasin.reconstituer({
      id: existant.id,
      nom: existant.nom,
      adresse: existant.adresse,
      codePostal: existant.codePostal,
      ville: existant.ville,
      centreId: existant.centreId,
      statut: existant.statut,
      images: [
        ImageMagasin.reconstituer({
          id: imageId,
          fichier,
          ordre: 0,
          ajouteeLe,
        }),
      ],
      creeLe: existant.creeLe,
      modifieLe: existant.modifieLe,
    });
  }

  function preparer(
    options: { magasins?: Magasin[]; unitOfWork?: UnitOfWorkEspion } = {},
  ): RetirerImageMagasinUseCase {
    magasinRepository = new MagasinRepositoryEnMemoire(
      options.magasins ?? [unMagasinAvecImage()],
    );
    const horloge = new HorlogeFixe(maintenant);
    stockage = new StockageImagesEnMemoire(horloge);
    stockage.deposer(magasinId, fichier, ajouteeLe);
    journal = new JournalEnMemoire();
    unitOfWork = options.unitOfWork ?? new UnitOfWorkEspion();
    return new RetirerImageMagasinUseCase(
      magasinRepository,
      stockage,
      unitOfWork,
      horloge,
      journal,
    );
  }

  async function imagesEnBase(): Promise<string[] | undefined> {
    return (await magasinRepository.get(magasinId))?.images.map(
      (image) => image.id.valeur,
    );
  }

  it('retire l’image en base, valide la transaction, puis supprime le fichier', async () => {
    await preparer().execute({ magasinId, imageId });

    expect(await imagesEnBase()).toEqual([]);
    expect((await magasinRepository.get(magasinId))?.modifieLe).toEqual(
      maintenant,
    );
    expect(unitOfWork.nombreDeCommits).toBe(1);
    expect(stockage.noms()).toEqual([]);
  });

  it('refuse un magasin inconnu (MAGASIN_NOT_FOUND)', async () => {
    const erreur = await preparer({ magasins: [] })
      .execute({ magasinId, imageId })
      .catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(MagasinIntrouvable);
    expect(stockage.noms()).toEqual([cheminFichier]);
  });

  it('refuse une image absente (MAGASIN_IMAGE_INTROUVABLE) sans toucher aux fichiers', async () => {
    const autre = ImageMagasinId.creer('1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e');

    const erreur = await preparer()
      .execute({ magasinId, imageId: autre })
      .catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(MagasinImageIntrouvable);
    expect(stockage.noms()).toEqual([cheminFichier]);
    expect(unitOfWork.nombreDeCommits).toBe(0);
  });

  it('laisse le fichier intact et l’image en base si l’enregistrement échoue', async () => {
    const useCase = preparer();
    const echec = new Error('base indisponible');
    magasinRepository.echouerAuProchainSave(echec);

    const erreur = await useCase
      .execute({ magasinId, imageId })
      .catch((e: unknown) => e);

    expect(erreur).toBe(echec);
    expect(await imagesEnBase()).toEqual([imageId.valeur]);
    expect(stockage.noms()).toEqual([cheminFichier]);
  });

  it('laisse le fichier intact si la validation de la transaction échoue', async () => {
    const echec = new Error('commit refusé par la base');

    const erreur = await preparer({
      unitOfWork: new UnitOfWorkQuiEchoueAuCommit(echec),
    })
      .execute({ magasinId, imageId })
      .catch((e: unknown) => e);

    expect(erreur).toBe(echec);
    expect(stockage.noms()).toEqual([cheminFichier]);
  });

  it('réussit quand même si l’effacement du fichier échoue : orphelin journalisé', async () => {
    const useCase = preparer();
    stockage.tomberEnPanneALaSuppression(fichier);

    await expect(
      useCase.execute({ magasinId, imageId }),
    ).resolves.toBeUndefined();

    expect(await imagesEnBase()).toEqual([]);
    expect(stockage.noms()).toEqual([cheminFichier]);
    expect(journal.avertissements).toEqual([
      expect.objectContaining({
        details: { magasinId: magasinId.valeur, fichier: fichier.valeur },
        cause: expect.any(StockageImagesIndisponible),
      }),
    ]);
  });
});
