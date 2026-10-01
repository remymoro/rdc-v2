import {
  Adresse,
  Centre,
  CentreId,
  CleDoublonCentre,
  CodePostal,
  Email,
  Nom,
  StatutCentre,
  Telephone,
  Ville,
} from '@rdc/referentiel-domain';
import type { Prisma } from '@rdc/shared-kernel-adapters';

type StatutCentrePrisma = Prisma.CentreModel['statut'];

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

/**
 * Ligne Prisma → Centre du domaine : reconstitution, jamais creer()
 * (TENETS-LIFECYCLE-005, REPO-007). Les value objects revalident la structure
 * (ADR-0003 R9).
 */
export function versCentre(ligne: Prisma.CentreModel): Centre {
  return Centre.reconstituer({
    id: CentreId.creer(ligne.id),
    nom: Nom.creer(ligne.nom),
    adresse: Adresse.creer(ligne.adresse),
    codePostal: CodePostal.creer(ligne.codePostal),
    ville: Ville.creer(ligne.ville),
    ...(ligne.telephone !== null && {
      telephone: Telephone.creer(ligne.telephone),
    }),
    ...(ligne.email !== null && { email: Email.creer(ligne.email) }),
    statut: versStatutDomaine(ligne.statut),
    creeLe: ligne.createdAt,
    modifieLe: ligne.updatedAt,
  });
}

function versStatutDomaine(statut: StatutCentrePrisma): StatutCentre {
  switch (statut) {
    case 'ACTIF':
      return StatutCentre.ACTIF;
    case 'INACTIF':
      return StatutCentre.INACTIF;
    case 'ARCHIVE':
      return StatutCentre.ARCHIVE;
  }
}

function versStatutPrisma(statut: StatutCentre): StatutCentrePrisma {
  switch (statut) {
    case StatutCentre.ACTIF:
      return 'ACTIF';
    case StatutCentre.INACTIF:
      return 'INACTIF';
    case StatutCentre.ARCHIVE:
      return 'ARCHIVE';
  }
}
