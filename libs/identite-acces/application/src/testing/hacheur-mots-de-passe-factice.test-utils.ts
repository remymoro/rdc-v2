import { MotDePasse, MotDePasseHache } from '@rdc/identite-acces-domain';
import { HacheurMotsDePasse } from '../ports/hacheur-mots-de-passe';

/**
 * Hacheur rapide et déterministe pour les tests : il garde les mots de passe
 * reçus (TENETS-TEST-006), note s'il a haché pendant une transaction et peut
 * simuler une action concurrente pendant le hachage.
 */
export class HacheurMotsDePasseFactice extends HacheurMotsDePasse {
  readonly motsDePasseRecus: MotDePasse[] = [];
  hacheDansUneTransaction = false;
  private actionPendantLeHachage: (() => Promise<void>) | null = null;

  /** @param transactionEnCours dit si une transaction est ouverte au moment du hachage. */
  constructor(
    private readonly transactionEnCours: () => boolean = () => false,
  ) {
    super();
  }

  /** Empreinte factice d'un mot de passe : jamais le texte en clair. */
  static empreinteDe(enClair: string): string {
    return `factice$${[...enClair].reverse().join('')}$empreinte`;
  }

  pendantLeHachage(action: () => Promise<void>): void {
    this.actionPendantLeHachage = action;
  }

  async hacher(motDePasse: MotDePasse): Promise<MotDePasseHache> {
    this.motsDePasseRecus.push(motDePasse);
    this.hacheDansUneTransaction ||= this.transactionEnCours();
    await this.actionPendantLeHachage?.();
    return MotDePasseHache.creer(
      HacheurMotsDePasseFactice.empreinteDe(motDePasse.valeur),
    );
  }
}
