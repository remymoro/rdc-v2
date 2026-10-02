import {
  type FiltreCentres,
  LecturesCentres,
  type MagasinsDuCentre,
  type VueCentre,
} from '@rdc/referentiel-application';
import type { CentreId } from '@rdc/referentiel-domain';
import type { Prisma, PrismaTransaction } from '@rdc/shared-kernel-adapters';
import { versStatutDomaine } from './centre.mapper';

/** Tri par nom, puis par identifiant pour un ordre stable. */
const ORDRE: Prisma.CentreOrderByWithRelationInput[] = [
  { nom: 'asc' },
  { id: 'asc' },
];

/**
 * Adaptateur de lecture des centres (TENETS-PORT-002) : projection directe des
 * lignes en VueCentre, sans reconstituer l'agrégat. Les magasins sont comptés
 * par une seule requête groupée, pas un aller-retour par centre.
 */
export class PrismaLecturesCentres extends LecturesCentres {
  constructor(private readonly transaction: PrismaTransaction) {
    super();
  }

  async list(filtre: FiltreCentres): Promise<readonly VueCentre[]> {
    const lignes = await this.transaction.client.centre.findMany({
      where: {
        ...(filtre.statut && { statut: filtre.statut }),
        ...(filtre.recherche && {
          OR: [
            { nom: { contains: filtre.recherche, mode: 'insensitive' } },
            { ville: { contains: filtre.recherche, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: ORDRE,
    });
    const magasins = await this.compterLesMagasins(lignes.map((l) => l.id));
    return lignes.map((ligne) => versVueCentre(ligne, magasins.get(ligne.id)));
  }

  async get(id: CentreId): Promise<VueCentre | null> {
    const ligne = await this.transaction.client.centre.findUnique({
      where: { id: id.valeur },
    });
    if (ligne === null) {
      return null;
    }
    const magasins = await this.compterLesMagasins([ligne.id]);
    return versVueCentre(ligne, magasins.get(ligne.id));
  }

  private async compterLesMagasins(
    centreIds: readonly string[],
  ): Promise<Map<string, MagasinsDuCentre>> {
    const groupes = await this.transaction.client.magasin.groupBy({
      by: ['centreId', 'statut'],
      where: { centreId: { in: [...centreIds] }, statut: { not: 'ARCHIVE' } },
      _count: { _all: true },
    });
    const parCentre = new Map<string, MagasinsDuCentre>();
    for (const groupe of groupes) {
      const actuel = parCentre.get(groupe.centreId) ?? AUCUN_MAGASIN;
      parCentre.set(groupe.centreId, {
        actifs:
          actuel.actifs + (groupe.statut === 'ACTIF' ? groupe._count._all : 0),
        inactifs:
          actuel.inactifs +
          (groupe.statut === 'INACTIF' ? groupe._count._all : 0),
      });
    }
    return parCentre;
  }
}

const AUCUN_MAGASIN: MagasinsDuCentre = { actifs: 0, inactifs: 0 };

function versVueCentre(
  ligne: Prisma.CentreModel,
  magasins: MagasinsDuCentre = AUCUN_MAGASIN,
): VueCentre {
  return {
    id: ligne.id,
    nom: ligne.nom,
    adresse: ligne.adresse,
    codePostal: ligne.codePostal,
    ville: ligne.ville,
    ...(ligne.telephone !== null && { telephone: ligne.telephone }),
    ...(ligne.email !== null && { email: ligne.email }),
    statut: versStatutDomaine(ligne.statut),
    magasins,
    creeLe: ligne.createdAt,
    modifieLe: ligne.updatedAt,
  };
}
