import { type MotDePasse, MotDePasseHache } from '@rdc/identite-acces-domain';
import { HacheurMotsDePasse } from '../ports/hacheur-mots-de-passe';

/**
 * Hacheur rapide et déterministe pour les tests : il note ce qu'il reçoit et
 * peut simuler une action concurrente pendant le hachage.
 */
export class HacheurMotsDePasseFactice extends HacheurMotsDePasse {
  readonly motsDePasseHaches: string[] = [];
  private actionPendantLeHachage: (() => Promise<void>) | null = null;

  /** Empreinte factice d'un mot de passe : jamais le texte en clair. */
  static empreinteDe(enClair: string): string {
    return `factice$${[...enClair].reverse().join('')}$empreinte`;
  }

  pendantLeHachage(action: () => Promise<void>): void {
    this.actionPendantLeHachage = action;
  }

  async hacher(motDePasse: MotDePasse): Promise<MotDePasseHache> {
    this.motsDePasseHaches.push(motDePasse.valeur);
    await this.actionPendantLeHachage?.();
    return MotDePasseHache.creer(
      HacheurMotsDePasseFactice.empreinteDe(motDePasse.valeur),
    );
  }
}
