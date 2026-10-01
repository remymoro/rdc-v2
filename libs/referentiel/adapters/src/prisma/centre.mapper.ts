import {
  Adresse,
  AdresseAbreviationInterdite,
  AdresseTropLongue,
  AdresseVide,
  Centre,
  CentreId,
  CentreIdInvalide,
  CentreIdVide,
  CleDoublonCentre,
  CodePostal,
  CodePostalInvalide,
  Email,
  EmailInvalide,
  EmailTropLong,
  EmailVide,
  Nom,
  NomTropLong,
  NomVide,
  StatutCentre,
  Telephone,
  TelephoneInvalide,
  TelephoneVide,
  Ville,
  VilleTropLongue,
  VilleVide,
} from '@rdc/referentiel-domain';
import type { Prisma } from '@rdc/shared-kernel-adapters';
import { CentrePersisteInvalide } from './centre-persiste-invalide';

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
 * Erreurs de validation des value objects lus en base. Liste fermée : toute
 * autre erreur est un bug et remonte telle quelle (TENETS-ERROR-005, ERROR-007).
 */
const ERREURS_VALIDATION_VALEURS = [
  CentreIdVide,
  CentreIdInvalide,
  NomVide,
  NomTropLong,
  AdresseVide,
  AdresseTropLongue,
  AdresseAbreviationInterdite,
  CodePostalInvalide,
  VilleVide,
  VilleTropLongue,
  TelephoneVide,
  TelephoneInvalide,
  EmailVide,
  EmailTropLong,
  EmailInvalide,
];

/**
 * Ligne Prisma → Centre du domaine : reconstitution, jamais creer()
 * (TENETS-LIFECYCLE-005, REPO-007). Les value objects revalident la structure
 * (ADR-0003 R9) ; une ligne invalide devient `CentrePersisteInvalide`
 * (TENETS-VALUE-003).
 */
export function versCentre(ligne: Prisma.CentreModel): Centre {
  try {
    return reconstituerCentre(ligne);
  } catch (erreur) {
    if (estErreurValidationValeur(erreur)) {
      throw new CentrePersisteInvalide(ligne.id, { cause: erreur });
    }
    throw erreur;
  }
}

function estErreurValidationValeur(erreur: unknown): erreur is Error {
  return ERREURS_VALIDATION_VALEURS.some((type) => erreur instanceof type);
}

function reconstituerCentre(ligne: Prisma.CentreModel): Centre {
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
