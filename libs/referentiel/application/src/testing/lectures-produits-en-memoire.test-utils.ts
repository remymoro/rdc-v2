import type { Produit } from '@rdc/referentiel-domain';
import {
  LecturesProduits,
  type VueProduit,
} from '../produit/lectures/lectures-produits';

/** Fake du port de lecture du catalogue (TENETS-TEST-002). */
export class LecturesProduitsEnMemoire extends LecturesProduits {
  private readonly vues = new Map<string, VueProduit>();

  enregistrer(produits: readonly Produit[]): void {
    produits.forEach((produit) =>
      this.vues.set(produit.id.valeur, {
        id: produit.id.valeur,
        code: produit.code.valeur,
        famille: produit.famille.valeur,
        sousFamille: produit.sousFamille.valeur,
        actif: produit.actif,
        creeLe: produit.creeLe,
        modifieLe: produit.modifieLe,
      }),
    );
  }

  async list(): Promise<readonly VueProduit[]> {
    return [...this.vues.values()].sort(
      (a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id),
    );
  }
}
