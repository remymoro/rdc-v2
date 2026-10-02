import { Produit, ProduitId, ProduitRepository } from '@rdc/referentiel-domain';

/** Fake de ProduitRepository pour les tests de use case (TENETS-TEST-002). */
export class ProduitRepositoryEnMemoire extends ProduitRepository {
  private readonly produits = new Map<string, Produit>();

  constructor(produitsExistants: Produit[] = []) {
    super();
    produitsExistants.forEach((produit) =>
      this.produits.set(produit.id.valeur, copie(produit)),
    );
  }

  async get(id: ProduitId): Promise<Produit | null> {
    const produit = this.produits.get(id.valeur);
    return produit === undefined ? null : copie(produit);
  }

  async save(produit: Produit): Promise<void> {
    this.produits.set(produit.id.valeur, copie(produit));
  }

  produitsEnregistres(): Produit[] {
    return [...this.produits.values()].map(copie);
  }
}

/** Comme une base : garde l'état enregistré, pas l'objet reçu. */
function copie(produit: Produit): Produit {
  return Produit.reconstituer({
    id: produit.id,
    code: produit.code,
    famille: produit.famille,
    sousFamille: produit.sousFamille,
    actif: produit.actif,
    creeLe: new Date(produit.creeLe.getTime()),
    modifieLe: new Date(produit.modifieLe.getTime()),
  });
}
