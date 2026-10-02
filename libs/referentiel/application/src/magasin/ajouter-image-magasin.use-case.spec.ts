import {
  ContenuImage,
  FichierImage,
  ImageMagasinId,
  MagasinArchive,
  MagasinId,
  StatutMagasin,
} from '@rdc/referentiel-domain';
import { MagasinIntrouvable } from '../errors';
import { StockageImagesIndisponible } from '../ports/stockage-images';
import { unContenuJpeg } from '../ports/stockage-images.contrat.test-utils';
import { GenerateurIdentifiantsFixe } from '../testing/generateur-identifiants-fixe.test-utils';
import { HorlogeFixe } from '../testing/horloge-fixe.test-utils';
import { JournalEnMemoire } from '../testing/journal-en-memoire.test-utils';
import { unMagasinExistant } from '../testing/magasin-existant.test-utils';
import { MagasinRepositoryEnMemoire } from '../testing/magasin-repository-en-memoire.test-utils';
import { StockageImagesEnMemoire } from '../testing/stockage-images-en-memoire.test-utils';
import {
  UnitOfWorkEspion,
  UnitOfWorkQuiEchoueAuCommit,
} from '../testing/unit-of-work-espion.test-utils';
import { AjouterImageMagasinUseCase } from './ajouter-image-magasin.use-case';

describe('AjouterImageMagasinUseCase (RDC-REF-007)', () => {
  const maintenant = new Date('2026-10-02T14:30:00.000Z');
  const magasinId = MagasinId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
  const imageId = ImageMagasinId.creer('0d4e2b8c-6a1f-4c3e-9b7d-5f2a8e1c4b6d');
  const fichierAttendu = FichierImage.creer(`${imageId.valeur}.jpg`);

  let magasinRepository: MagasinRepositoryEnMemoire;
  let stockage: StockageImagesEnMemoire;
  let journal: JournalEnMemoire;
  let unitOfWork: UnitOfWorkEspion;

  function preparer(
    options: {
      statut?: StatutMagasin | null;
      unitOfWork?: UnitOfWorkEspion;
    } = {},
  ): AjouterImageMagasinUseCase {
    const statut =
      options.statut === undefined ? StatutMagasin.ACTIF : options.statut;
    magasinRepository = new MagasinRepositoryEnMemoire(
      statut === null ? [] : [unMagasinExistant(magasinId, statut)],
    );
    const horloge = new HorlogeFixe(maintenant);
    stockage = new StockageImagesEnMemoire(horloge);
    journal = new JournalEnMemoire();
    unitOfWork = options.unitOfWork ?? new UnitOfWorkEspion();
    return new AjouterImageMagasinUseCase(
      magasinRepository,
      stockage,
      new GenerateurIdentifiantsFixe({ imageMagasinId: imageId }),
      unitOfWork,
      horloge,
      journal,
    );
  }

  it('écrit le fichier <uuid>.jpg puis enregistre l’image, en une transaction', async () => {
    const image = await preparer().execute({
      magasinId,
      contenu: unContenuJpeg(42),
    });

    expect(image.id.equals(imageId)).toBe(true);
    expect(image.fichier.equals(fichierAttendu)).toBe(true);
    expect(image.ordre).toBe(0);
    expect(image.ajouteeLe).toEqual(maintenant);
    expect(stockage.contenu(magasinId, fichierAttendu)).toEqual(
      new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 42, 42, 42]),
    );
    const enregistre = await magasinRepository.get(magasinId);
    expect(enregistre?.images.map((i) => i.fichier.valeur)).toEqual([
      fichierAttendu.valeur,
    ]);
    expect(enregistre?.modifieLe).toEqual(maintenant);
    expect(unitOfWork.nombreDeCommits).toBe(1);
  });

  it('termine l’écriture du fichier avant d’ouvrir la transaction', async () => {
    const useCase = preparer();
    const run = jest.spyOn(unitOfWork, 'run');
    const enregistrer = stockage.enregistrer.bind(stockage);
    jest.spyOn(stockage, 'enregistrer').mockImplementation(async (...args) => {
      expect(run).not.toHaveBeenCalled();
      await enregistrer(...args);
    });

    await useCase.execute({ magasinId, contenu: unContenuJpeg() });

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('relit les images ajoutées pendant l’écriture disque', async () => {
    const useCase = preparer();
    const autreId = ImageMagasinId.creer(
      '1e5f3c9d-7b2a-4d4f-8c8e-6a3b9f2d5c7e',
    );
    const enregistrer = stockage.enregistrer.bind(stockage);
    jest.spyOn(stockage, 'enregistrer').mockImplementation(async (...args) => {
      await enregistrer(...args);
      const concurrent = (await magasinRepository.get(magasinId))!;
      concurrent.ajouterImage(
        {
          id: autreId,
          fichier: FichierImage.creer(autreId.valeur + '.jpg'),
        },
        maintenant,
      );
      await magasinRepository.save(concurrent);
    });

    const image = await useCase.execute({
      magasinId,
      contenu: unContenuJpeg(),
    });

    expect(image.ordre).toBe(1);
    expect(
      (await magasinRepository.get(magasinId))?.images.map((i) => i.id.valeur),
    ).toEqual([autreId.valeur, imageId.valeur]);
  });

  it('compense le fichier si le magasin est archivé pendant l’écriture disque', async () => {
    const useCase = preparer();
    const enregistrer = stockage.enregistrer.bind(stockage);
    jest.spyOn(stockage, 'enregistrer').mockImplementation(async (...args) => {
      await enregistrer(...args);
      const concurrent = (await magasinRepository.get(magasinId))!;
      concurrent.archiver(maintenant);
      await magasinRepository.save(concurrent);
    });

    await expect(
      useCase.execute({ magasinId, contenu: unContenuJpeg() }),
    ).rejects.toBeInstanceOf(MagasinArchive);
    expect(stockage.noms()).toEqual([]);
    expect(unitOfWork.nombreDeCommits).toBe(0);
  });

  it('nomme le fichier d’après le format reconnu, pas d’après le client', async () => {
    const png = ContenuImage.creer(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]),
    );

    const image = await preparer().execute({ magasinId, contenu: png });

    expect(image.fichier.valeur).toBe(`${imageId.valeur}.png`);
    expect(stockage.noms()).toEqual([
      `${magasinId.valeur}/${imageId.valeur}.png`,
    ]);
  });

  it('refuse un magasin inconnu (MAGASIN_NOT_FOUND) sans écrire de fichier', async () => {
    const useCase = preparer({ statut: null });
    const enregistrer = jest.spyOn(stockage, 'enregistrer');
    const erreur = await useCase
      .execute({ magasinId, contenu: unContenuJpeg() })
      .catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(MagasinIntrouvable);
    expect(enregistrer).not.toHaveBeenCalled();
    expect(stockage.noms()).toEqual([]);
    expect(unitOfWork.nombreDeCommits).toBe(0);
  });

  it('refuse un magasin archivé (MAGASIN_ARCHIVED) sans écrire de fichier', async () => {
    const useCase = preparer({ statut: StatutMagasin.ARCHIVE });
    const enregistrer = jest.spyOn(stockage, 'enregistrer');
    const erreur = await useCase
      .execute({ magasinId, contenu: unContenuJpeg() })
      .catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(MagasinArchive);
    expect(enregistrer).not.toHaveBeenCalled();
    expect(stockage.noms()).toEqual([]);
    expect(unitOfWork.nombreDeCommits).toBe(0);
  });

  it('laisse passer StockageImagesIndisponible sans enregistrer l’image', async () => {
    const useCase = preparer();
    stockage.tomberEnPanneAlEnregistrement();

    const erreur = await useCase
      .execute({ magasinId, contenu: unContenuJpeg() })
      .catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(StockageImagesIndisponible);
    expect((await magasinRepository.get(magasinId))?.images).toEqual([]);
    expect(unitOfWork.nombreDeCommits).toBe(0);
  });

  describe('la base fait foi : transaction en échec après l’écriture du fichier', () => {
    const echecCommit = new Error('commit refusé par la base');

    it('supprime le fichier écrit et relance l’erreur de la transaction', async () => {
      const useCase = preparer({
        unitOfWork: new UnitOfWorkQuiEchoueAuCommit(echecCommit),
      });

      const erreur = await useCase
        .execute({ magasinId, contenu: unContenuJpeg() })
        .catch((e: unknown) => e);

      expect(erreur).toBe(echecCommit);
      expect(stockage.noms()).toEqual([]);
      expect(journal.avertissements).toEqual([]);
    });

    it('laisse le fichier orphelin et le journalise si sa suppression échoue aussi', async () => {
      const useCase = preparer({
        unitOfWork: new UnitOfWorkQuiEchoueAuCommit(echecCommit),
      });
      stockage.tomberEnPanneALaSuppression(fichierAttendu);

      const erreur = await useCase
        .execute({ magasinId, contenu: unContenuJpeg() })
        .catch((e: unknown) => e);

      // L'erreur d'origine n'est pas masquée par celle du nettoyage (TENETS-UOW-010).
      expect(erreur).toBe(echecCommit);
      expect(stockage.noms()).toEqual([
        `${magasinId.valeur}/${fichierAttendu.valeur}`,
      ]);
      expect(journal.avertissements).toEqual([
        expect.objectContaining({
          details: {
            magasinId: magasinId.valeur,
            fichier: fichierAttendu.valeur,
          },
          cause: expect.any(StockageImagesIndisponible),
        }),
      ]);
    });
  });
});
