export class Nom {
  private constructor(readonly valeur: string) {}

  static creer(valeur: string): Nom {
    return new Nom(valeur);
  }
}
