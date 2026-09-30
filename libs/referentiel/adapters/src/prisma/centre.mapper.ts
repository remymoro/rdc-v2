import {
  Centre,
  CleDoublonCentre,
  StatutCentre,
} from '@rdc/referentiel-domain';
import type { Prisma } from '@rdc/shared-kernel-adapters';

type StatutCentrePrisma = Prisma.CentreUncheckedCreateInput['statut'];

/** Centre du domaine → ligne Prisma (mapper directionnel, TENETS-LIFECYCLE-005). */
export function versLigneCentre(
  centre: Centre,
): Prisma.CentreUncheckedCreateInput {
  return {
    id: centre.id.valeur,
    nom: centre.nom.valeur,
    adresse: centre.adresse.valeur,
    codePostal: centre.codePostal.valeur,
    ville: centre.ville.valeur,
    telephone: centre.telephone?.valeur ?? null,
    email: centre.email?.valeur ?? null,
    statut: versStatutPrisma(centre.statut),
    createdAt: centre.creeLe,
    updatedAt: centre.modifieLe,
    cleDoublon: CleDoublonCentre.depuis(centre).valeur,
  };
}

function versStatutPrisma(statut: StatutCentre): StatutCentrePrisma {
  switch (statut) {
    case StatutCentre.ACTIF:
      return 'ACTIF';
    case StatutCentre.ARCHIVE:
      return 'ARCHIVE';
  }
}
