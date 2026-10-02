import {
  LecturesMagasins,
  type VueMagasin,
} from '@rdc/referentiel-application';
import type { CentreId, MagasinId } from '@rdc/referentiel-domain';
import type { Prisma, PrismaTransaction } from '@rdc/shared-kernel-adapters';
import {
  fichierDepuisUrl,
  type LigneMagasinAvecImages,
  versStatutDomaine,
} from './magasin.mapper';

/** Tri v1 supposé : par nom, puis par identifiant pour un ordre stable. */
const ORDRE: Prisma.MagasinOrderByWithRelationInput[] = [
  { nom: 'asc' },
  { id: 'asc' },
];

/** Images dans leur ordre d'affichage, comme l'agrégat (RDC-REF-007). */
const AVEC_IMAGES = {
  images: {
    orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.MagasinInclude;

/**
 * Adaptateur de lecture des magasins (TENETS-PORT-002) : projection directe des
 * lignes en VueMagasin, sans reconstituer l'agrégat.
 */
export class PrismaLecturesMagasins extends LecturesMagasins {
  constructor(private readonly transaction: PrismaTransaction) {
    super();
  }

  async list(): Promise<readonly VueMagasin[]> {
    const lignes = await this.transaction.client.magasin.findMany({
      orderBy: ORDRE,
      include: AVEC_IMAGES,
    });
    return lignes.map(versVueMagasin);
  }

  async listByCentre(centreId: CentreId): Promise<readonly VueMagasin[]> {
    const lignes = await this.transaction.client.magasin.findMany({
      where: { centreId: centreId.valeur },
      orderBy: ORDRE,
      include: AVEC_IMAGES,
    });
    return lignes.map(versVueMagasin);
  }

  async get(id: MagasinId): Promise<VueMagasin | null> {
    const ligne = await this.transaction.client.magasin.findUnique({
      where: { id: id.valeur },
      include: AVEC_IMAGES,
    });
    return ligne === null ? null : versVueMagasin(ligne);
  }
}

function versVueMagasin(ligne: LigneMagasinAvecImages): VueMagasin {
  return {
    id: ligne.id,
    nom: ligne.nom,
    adresse: ligne.adresse,
    codePostal: ligne.codePostal,
    ville: ligne.ville,
    ...(ligne.telephone !== null && { telephone: ligne.telephone }),
    ...(ligne.email !== null && { email: ligne.email }),
    statut: versStatutDomaine(ligne.statut),
    centreId: ligne.centreId,
    images: ligne.images.map((image) => ({
      id: image.id,
      fichier: fichierDepuisUrl(image.url),
      ordre: image.ordre,
      ajouteeLe: image.createdAt,
    })),
    creeLe: ligne.createdAt,
    modifieLe: ligne.updatedAt,
  };
}
