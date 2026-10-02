import type { Produit } from '../produit/produit';
import type { ProduitId } from '../produit/produit-id';

/** Persistance de l'agrégat Produit (TENETS-REPO-001). */
export abstract class ProduitRepository {
  /** Le produit, ou null s'il n'existe pas (TENETS-REPO-004/005). */
  abstract get(id: ProduitId): Promise<Produit | null>;

  /** Enregistre l'agrégat complet (TENETS-REPO-002). */
  abstract save(produit: Produit): Promise<void>;
}
