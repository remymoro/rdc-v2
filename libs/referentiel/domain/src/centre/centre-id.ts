export class CentreId {
  // Rend le type nominal : un autre identifiant de même forme n'est pas un CentreId.
  private readonly type = 'CentreId';

  private constructor(readonly valeur: string) {}

  static creer(valeur: string): CentreId {
    return new CentreId(valeur);
  }

  equals(autre: CentreId): boolean {
    return this.valeur === autre.valeur;
  }
}
