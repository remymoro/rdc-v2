import {
  Adresse,
  AdresseAbreviationInterdite,
  AdresseTropLongue,
  AdresseVide,
  CentreId,
  CentreIdInvalide,
  CentreIdVide,
  CleDoublonMagasin,
  CodePostal,
  CodePostalInvalide,
  Email,
  EmailInvalide,
  EmailTropLong,
  EmailVide,
  Magasin,
  MagasinId,
  MagasinIdInvalide,
  MagasinIdVide,
  Nom,
  NomTropLong,
  NomVide,
  StatutMagasin,
  Telephone,
  TelephoneInvalide,
  TelephoneVide,
  Ville,
  VilleTropLongue,
  VilleVide,
} from '@rdc/referentiel-domain';
import type { Prisma } from '@rdc/shared-kernel-adapters';
import { MagasinPersisteInvalide } from './magasin-persiste-invalide';

// La table v1 réutilise l'enum StatutCentre pour les magasins (ADR-0008).
type StatutMagasinPrisma = Prisma.MagasinModel['statut'];

/** Magasin du domaine → ligne Prisma (mapper directionnel, TENETS-LIFECYCLE-005). */
export function versLigneMagasin(
  magasin: Magasin,
): Prisma.MagasinUncheckedCreateInput {
  return {
    id: magasin.id.valeur,
    nom: magasin.nom.valeur,
    adresse: magasin.adresse.valeur,
    codePostal: magasin.codePostal.valeur,
    ville: magasin.ville.valeur,
    telephone: magasin.telephone?.valeur ?? null,
    email: magasin.email?.valeur ?? null,
    statut: versStatutPrisma(magasin.statut),
    centreId: magasin.centreId.valeur,
    createdAt: magasin.creeLe,
    updatedAt: magasin.modifieLe,
    cleDoublon: CleDoublonMagasin.depuis(magasin).valeur,
  };
}

/**
 * Erreurs de validation des value objects lus en base. Liste fermée : toute
 * autre erreur est un bug et remonte telle quelle (TENETS-ERROR-005, ERROR-007).
 */
const ERREURS_VALIDATION_VALEURS = [
  MagasinIdVide,
  MagasinIdInvalide,
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
 * Ligne Prisma → Magasin du domaine : reconstitution, jamais creer()
 * (TENETS-LIFECYCLE-005, REPO-007). Une ligne invalide devient
 * `MagasinPersisteInvalide` (TENETS-VALUE-003).
 */
export function versMagasin(ligne: Prisma.MagasinModel): Magasin {
  try {
    return reconstituerMagasin(ligne);
  } catch (erreur) {
    if (estErreurValidationValeur(erreur)) {
      throw new MagasinPersisteInvalide(ligne.id, { cause: erreur });
    }
    throw erreur;
  }
}

function estErreurValidationValeur(erreur: unknown): erreur is Error {
  return ERREURS_VALIDATION_VALEURS.some((type) => erreur instanceof type);
}

function reconstituerMagasin(ligne: Prisma.MagasinModel): Magasin {
  return Magasin.reconstituer({
    id: MagasinId.creer(ligne.id),
    nom: Nom.creer(ligne.nom),
    adresse: Adresse.creer(ligne.adresse),
    codePostal: CodePostal.creer(ligne.codePostal),
    ville: Ville.creer(ligne.ville),
    centreId: CentreId.creer(ligne.centreId),
    ...(ligne.telephone !== null && {
      telephone: Telephone.creer(ligne.telephone),
    }),
    ...(ligne.email !== null && { email: Email.creer(ligne.email) }),
    statut: versStatutDomaine(ligne.statut),
    images: [],
    creeLe: ligne.createdAt,
    modifieLe: ligne.updatedAt,
  });
}

export function versStatutDomaine(statut: StatutMagasinPrisma): StatutMagasin {
  switch (statut) {
    case 'ACTIF':
      return StatutMagasin.ACTIF;
    case 'INACTIF':
      return StatutMagasin.INACTIF;
    case 'ARCHIVE':
      return StatutMagasin.ARCHIVE;
  }
}

function versStatutPrisma(statut: StatutMagasin): StatutMagasinPrisma {
  switch (statut) {
    case StatutMagasin.ACTIF:
      return 'ACTIF';
    case StatutMagasin.INACTIF:
      return 'INACTIF';
    case StatutMagasin.ARCHIVE:
      return 'ARCHIVE';
  }
}
