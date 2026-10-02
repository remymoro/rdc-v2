import type {
  ModificationsProduit,
  NouveauProduit,
  ProduitId,
} from '@rdc/referentiel-domain';

/** Création d'un produit : tout l'état initial sauf l'identifiant. */
export type CreerProduitCommande = Omit<NouveauProduit, 'id'>;

/** Modification d'un produit : champ absent = inchangé. */
export interface ModifierProduitCommande {
  readonly produitId: ProduitId;
  readonly changements: ModificationsProduit;
}

/** Activation ou désactivation d'un produit. */
export interface ChangerActiviteProduitCommande {
  readonly produitId: ProduitId;
}
