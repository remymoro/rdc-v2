import { texteObligatoire } from './texte-obligatoire';

/** Erreur métier : une adresse ne peut pas être vide. */
export class AdresseVide extends Error {
  readonly code = 'ADRESSE_EMPTY';

  constructor() {
    super("L'adresse ne peut pas être vide");
    this.name = 'AdresseVide';
  }
}

/** Erreur métier : une adresse ne dépasse pas 255 caractères. */
export class AdresseTropLongue extends Error {
  readonly code = 'ADRESSE_TOO_LONG';

  constructor(readonly longueurMaximale: number) {
    super(`L'adresse ne peut pas dépasser ${longueurMaximale} caractères`);
    this.name = 'AdresseTropLongue';
  }
}

/** Erreur métier : le type de voie s'écrit en entier (ADR-0006). */
export class AdresseAbreviationInterdite extends Error {
  readonly code = 'ADRESSE_ABREVIATION_INTERDITE';

  constructor(
    readonly abreviation: string,
    readonly formeComplete: string,
  ) {
    super(
      `Merci de saisir l’adresse complète : utilisez "${formeComplete}" au lieu de "${abreviation}".`,
    );
    this.name = 'AdresseAbreviationInterdite';
  }
}

/** Ligne de rue d'une adresse postale (numéro, type et nom de voie). */
export class Adresse {
  static readonly LONGUEUR_MAXIMALE = 255;

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Adresse {
    const adresse = texteObligatoire(valeur, {
      longueurMaximale: Adresse.LONGUEUR_MAXIMALE,
      espacesInternes: 'reduits',
      siVide: () => new AdresseVide(),
      siTropLong: (longueurMaximale) => new AdresseTropLongue(longueurMaximale),
    });
    verifierAbsenceAbreviation(adresse);
    return new Adresse(adresse);
  }
}

/**
 * Règle de RDC v1 reprise à l'identique (ADR-0006) : contrôle mot à mot, sans
 * tenir compte de la casse. Un nom propre identique à une abréviation (« Lot »)
 * est refusé : c'est voulu.
 */
const ABREVIATIONS_INTERDITES: ReadonlyMap<string, string> = new Map([
  ['AV', 'Avenue'],
  ['AVE', 'Avenue'],
  ['BD', 'Boulevard'],
  ['BLVD', 'Boulevard'],
  ['RTE', 'Route'],
  ['IMP', 'Impasse'],
  ['ALL', 'Allée'],
  ['SQ', 'Square'],
  ['FG', 'Faubourg'],
  ['PL', 'Place'],
  ['ESP', 'Esplanade'],
  ['PASS', 'Passage'],
  ['VLA', 'Villa'],
  ['RES', 'Résidence'],
  ['RESID', 'Résidence'],
  ['CHE', 'Chemin'],
  ['CRS', 'Cours'],
  ['HAM', 'Hameau'],
  ['LOT', 'Lotissement'],
]);

const SEPARATEURS_DE_MOTS = /[\s,'.]+/;

function verifierAbsenceAbreviation(adresse: string): void {
  for (const mot of adresse.split(SEPARATEURS_DE_MOTS)) {
    const formeComplete = ABREVIATIONS_INTERDITES.get(mot.toUpperCase());
    if (formeComplete !== undefined) {
      throw new AdresseAbreviationInterdite(mot, formeComplete);
    }
  }
}
