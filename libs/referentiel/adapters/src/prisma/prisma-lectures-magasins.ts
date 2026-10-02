import {
  LecturesMagasins,
  type VueMagasin,
} from '@rdc/referentiel-application';
import type { CentreId, MagasinId } from '@rdc/referentiel-domain';
import type { Prisma, PrismaTransaction } from '@rdc/shared-kernel-adapters';
import { versStatutDomaine } from './magasin.mapper';

/** Tri v1 supposé : par nom, puis par identifiant pour un ordre stable. */
const ORDRE: Prisma.MagasinOrderByWithRelationInput[] = [
  { nom: 'asc' },
  { id: 'asc' },
];

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
    });
    return lignes.map(versVueMagasin);
  }

  async listByCentre(centreId: CentreId): Promise<readonly VueMagasin[]> {
    const lignes = await this.transaction.client.magasin.findMany({
      where: { centreId: centreId.valeur },
      orderBy: ORDRE,
    });
    return lignes.map(versVueMagasin);
  }

  async get(id: MagasinId): Promise<VueMagasin | null> {
    const ligne = await this.transaction.client.magasin.findUnique({
      where: { id: id.valeur },
    });
    return ligne === null ? null : versVueMagasin(ligne);
  }
}

function versVueMagasin(ligne: Prisma.MagasinModel): VueMagasin {
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
    creeLe: ligne.createdAt,
    modifieLe: ligne.updatedAt,
  };
}
