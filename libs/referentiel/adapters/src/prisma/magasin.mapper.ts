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
  FichierImage,
  FichierImageInvalide,
  ImageMagasin,
  ImageMagasinId,
  ImageMagasinIdInvalide,
  ImageMagasinIdVide,
  Magasin,
  MagasinId,
  MagasinIdInvalide,
  MagasinIdVide,
  Nom,
  NomTropLong,
  NomVide,
  OrdreImageInvalide,
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

/** Ligne `Magasin` lue avec ses images : l'agrégat se relit en entier. */
export type LigneMagasinAvecImages = Prisma.MagasinModel & {
  readonly images: readonly Prisma.MagasinImageModel[];
};

/**
 * La colonne `url` garde le format v1 (`/uploads/magasins/<id>/<fichier>`) :
 * les lignes reprises de la v1 et celles de la v2 restent identiques.
 */
const PREFIXE_URL_IMAGES = '/uploads/magasins';

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

/** Images du magasin → lignes `MagasinImage` (mapper directionnel). */
export function versLignesImagesMagasin(
  magasin: Magasin,
): Prisma.MagasinImageUncheckedCreateInput[] {
  return magasin.images.map((image) => ({
    id: image.id.valeur,
    url: `${PREFIXE_URL_IMAGES}/${magasin.id.valeur}/${image.fichier.valeur}`,
    ordre: image.ordre,
    magasinId: magasin.id.valeur,
    createdAt: image.ajouteeLe,
  }));
}

/**
 * Nom du fichier : dernier segment du chemin de l'URL. Accepte aussi les URL
 * absolues d'avant le stockage local (ADR-0008). Le nom n'est pas validé ici.
 */
export function fichierDepuisUrl(url: string): string {
  const chemin = new URL(url, 'http://images.invalid').pathname;
  return chemin.slice(chemin.lastIndexOf('/') + 1);
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
  ImageMagasinIdVide,
  ImageMagasinIdInvalide,
  FichierImageInvalide,
  OrdreImageInvalide,
];

/**
 * Ligne Prisma → Magasin du domaine : reconstitution, jamais creer()
 * (TENETS-LIFECYCLE-005, REPO-007). Une ligne invalide devient
 * `MagasinPersisteInvalide` (TENETS-VALUE-003).
 */
export function versMagasin(ligne: LigneMagasinAvecImages): Magasin {
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

function reconstituerMagasin(ligne: LigneMagasinAvecImages): Magasin {
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
    images: ligne.images.map(versImageMagasin),
    creeLe: ligne.createdAt,
    modifieLe: ligne.updatedAt,
  });
}

function versImageMagasin(ligne: Prisma.MagasinImageModel): ImageMagasin {
  return ImageMagasin.reconstituer({
    id: ImageMagasinId.creer(ligne.id),
    fichier: FichierImage.creer(fichierDepuisUrl(ligne.url)),
    ordre: ligne.ordre,
    ajouteeLe: ligne.createdAt,
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
