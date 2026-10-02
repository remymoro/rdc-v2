import {
  CodeProduit,
  CodeProduitVide,
  Famille,
  FamilleTropLongue,
  FamilleVide,
  Produit,
  ProduitId,
  ProduitIdInvalide,
  ProduitIdVide,
  SousFamille,
  SousFamilleTropLongue,
  SousFamilleVide,
} from '@rdc/referentiel-domain';
import type { Prisma } from '@rdc/shared-kernel-adapters';
import { ProduitPersisteInvalide } from './produit-persiste-invalide';

/** Produit du domaine → ligne Prisma (mapper directionnel). */
export function versLigneProduit(
  produit: Produit,
): Prisma.ProduitUncheckedCreateInput {
  return {
    id: produit.id.valeur,
    code: produit.code.valeur,
    famille: produit.famille.valeur,
    sousFamille: produit.sousFamille.valeur,
    actif: produit.actif,
    createdAt: produit.creeLe,
    updatedAt: produit.modifieLe,
  };
}

/** Erreurs de validation des value objects lus en base (liste fermée). */
const ERREURS_VALIDATION_VALEURS = [
  ProduitIdVide,
  ProduitIdInvalide,
  CodeProduitVide,
  FamilleVide,
  FamilleTropLongue,
  SousFamilleVide,
  SousFamilleTropLongue,
];

/**
 * Ligne Prisma → Produit : reconstitution, jamais creer() ; le code est relu
 * avec la règle tolérante des données importées (RDC-REF-008).
 */
export function versProduit(ligne: Prisma.ProduitModel): Produit {
  try {
    return Produit.reconstituer({
      id: ProduitId.creer(ligne.id),
      code: CodeProduit.reconstituer(ligne.code),
      famille: Famille.creer(ligne.famille),
      sousFamille: SousFamille.creer(ligne.sousFamille),
      actif: ligne.actif,
      creeLe: ligne.createdAt,
      modifieLe: ligne.updatedAt,
    });
  } catch (erreur) {
    if (ERREURS_VALIDATION_VALEURS.some((type) => erreur instanceof type)) {
      throw new ProduitPersisteInvalide(ligne.id, { cause: erreur as Error });
    }
    throw erreur;
  }
}
