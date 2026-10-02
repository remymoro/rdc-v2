import type { VueProduit } from '@rdc/referentiel-application';
import type { Produit } from '@rdc/referentiel-domain';

/**
 * Contrat de réponse ProduitDto (ADR-0009). Forme supposée à partir du modèle
 * v1 (id, code, famille, sousFamille, actif, dates) : à confronter à la v1.
 */
export interface ProduitReponse {
  id: string;
  code: string;
  famille: string;
  sousFamille: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export function versProduitReponse(produit: Produit): ProduitReponse {
  return vueVersProduitReponse({
    id: produit.id.valeur,
    code: produit.code.valeur,
    famille: produit.famille.valeur,
    sousFamille: produit.sousFamille.valeur,
    actif: produit.actif,
    creeLe: produit.creeLe,
    modifieLe: produit.modifieLe,
  });
}

export function vueVersProduitReponse(vue: VueProduit): ProduitReponse {
  return {
    id: vue.id,
    code: vue.code,
    famille: vue.famille,
    sousFamille: vue.sousFamille,
    actif: vue.actif,
    createdAt: vue.creeLe.toISOString(),
    updatedAt: vue.modifieLe.toISOString(),
  };
}
