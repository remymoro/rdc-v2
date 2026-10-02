import type { CodeProduit } from './code-produit';
import type { Famille, SousFamille } from './famille';
import type { ProduitId } from './produit-id';

/** État initial complet d'un nouveau produit (TENETS-LIFECYCLE-003). */
export interface NouveauProduit {
  readonly id: ProduitId;
  readonly code: CodeProduit;
  readonly famille: Famille;
  readonly sousFamille: SousFamille;
}

/** État persisté complet d'un produit existant (TENETS-LIFECYCLE-005). */
export interface EtatProduit extends NouveauProduit {
  readonly actif: boolean;
  readonly creeLe: Date;
  readonly modifieLe: Date;
}

/** Changements demandés : champ absent = inchangé. */
export interface ModificationsProduit {
  readonly code?: CodeProduit;
  readonly famille?: Famille;
  readonly sousFamille?: SousFamille;
}

/**
 * Produit du catalogue (RDC-REF-008). On le désactive, on ne le supprime pas :
 * les articles pesés gardent leur propre copie de la référence (RDC-SAISIE-005).
 */
export class Produit {
  private constructor(
    readonly id: ProduitId,
    private codeActuel: CodeProduit,
    private familleActuelle: Famille,
    private sousFamilleActuelle: SousFamille,
    private estActif: boolean,
    readonly creeLe: Date,
    private derniereModification: Date,
  ) {}

  get code(): CodeProduit {
    return this.codeActuel;
  }

  get famille(): Famille {
    return this.familleActuelle;
  }

  get sousFamille(): SousFamille {
    return this.sousFamilleActuelle;
  }

  get actif(): boolean {
    return this.estActif;
  }

  get modifieLe(): Date {
    return this.derniereModification;
  }

  /** Nouveau produit : actif à la création (TENETS-LIFECYCLE-004). */
  static creer(nouveau: NouveauProduit, maintenant: Date): Produit {
    return new Produit(
      nouveau.id,
      nouveau.code,
      nouveau.famille,
      nouveau.sousFamille,
      true,
      maintenant,
      maintenant,
    );
  }

  /** Produit relu depuis la base, restitué tel quel (TENETS-LIFECYCLE-005). */
  static reconstituer(etat: EtatProduit): Produit {
    return new Produit(
      etat.id,
      etat.code,
      etat.famille,
      etat.sousFamille,
      etat.actif,
      etat.creeLe,
      etat.modifieLe,
    );
  }

  /** Corrige le classement ou le code ; possible même pour un produit inactif. */
  modifier(changements: ModificationsProduit, maintenant: Date): void {
    let modifie = false;

    if (
      changements.code &&
      changements.code.valeur !== this.codeActuel.valeur
    ) {
      this.codeActuel = changements.code;
      modifie = true;
    }
    if (
      changements.famille &&
      changements.famille.valeur !== this.familleActuelle.valeur
    ) {
      this.familleActuelle = changements.famille;
      modifie = true;
    }
    if (
      changements.sousFamille &&
      changements.sousFamille.valeur !== this.sousFamilleActuelle.valeur
    ) {
      this.sousFamilleActuelle = changements.sousFamille;
      modifie = true;
    }

    if (modifie) {
      this.derniereModification = maintenant;
    }
  }

  /** Retire le produit des choix proposés, sans effacer l'historique. */
  desactiver(maintenant: Date): void {
    this.changerActivite(false, maintenant);
  }

  /** Remet le produit dans le catalogue utilisé. */
  activer(maintenant: Date): void {
    this.changerActivite(true, maintenant);
  }

  private changerActivite(actif: boolean, maintenant: Date): void {
    if (this.estActif === actif) {
      return;
    }
    this.estActif = actif;
    this.derniereModification = maintenant;
  }
}
