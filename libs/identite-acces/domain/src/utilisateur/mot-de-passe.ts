/** Texte affiché à la place d'un secret dans un message ou un journal. */
const MASQUE = '[masqué]';

/** Erreur métier : un mot de passe fait au moins 12 caractères. */
export class MotDePasseTropCourt extends Error {
  readonly code = 'MOT_DE_PASSE_TROP_COURT';

  constructor(readonly longueurMinimale: number) {
    super(
      `Le mot de passe doit contenir au moins ${longueurMinimale} caractères`,
    );
    this.name = 'MotDePasseTropCourt';
  }
}

/** Erreur métier : un mot de passe ne dépasse pas 128 caractères. */
export class MotDePasseTropLong extends Error {
  readonly code = 'MOT_DE_PASSE_TROP_LONG';

  constructor(readonly longueurMaximale: number) {
    super(
      `Le mot de passe ne peut pas dépasser ${longueurMaximale} caractères`,
    );
    this.name = 'MotDePasseTropLong';
  }
}

/**
 * Mot de passe en clair, tel que saisi : il ne sert qu'à être haché ou
 * vérifié, et n'est jamais conservé (RDC-ACCES-007). La longueur maximale
 * protège le hachage lent d'un texte géant (audit A-06). Les espaces comptent.
 */
export class MotDePasse {
  static readonly LONGUEUR_MINIMALE = 12;
  static readonly LONGUEUR_MAXIMALE = 128;

  // Rend le type nominal : jamais confondu avec son empreinte (et inversement).
  private readonly type = 'MotDePasse';

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): MotDePasse {
    if (valeur.length < MotDePasse.LONGUEUR_MINIMALE) {
      throw new MotDePasseTropCourt(MotDePasse.LONGUEUR_MINIMALE);
    }
    if (valeur.length > MotDePasse.LONGUEUR_MAXIMALE) {
      throw new MotDePasseTropLong(MotDePasse.LONGUEUR_MAXIMALE);
    }
    return new MotDePasse(valeur);
  }

  toString(): string {
    return MASQUE;
  }

  toJSON(): string {
    return MASQUE;
  }
}

/** Erreur métier : l'empreinte d'un mot de passe ne peut pas être vide. */
export class MotDePasseHacheVide extends Error {
  readonly code = 'MOT_DE_PASSE_HACHE_VIDE';

  constructor() {
    super("L'empreinte du mot de passe est obligatoire");
    this.name = 'MotDePasseHacheVide';
  }
}

/**
 * Empreinte d'un mot de passe, seule forme conservée. Son format appartient
 * à l'adapter de hachage ; le domaine ne la lit pas.
 */
export class MotDePasseHache {
  private readonly type = 'MotDePasseHache';

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): MotDePasseHache {
    if (valeur.trim().length === 0) {
      throw new MotDePasseHacheVide();
    }
    return new MotDePasseHache(valeur);
  }

  toString(): string {
    return MASQUE;
  }

  toJSON(): string {
    return MASQUE;
  }
}
