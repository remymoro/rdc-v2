import { UtilisateurId } from '@rdc/identite-acces-domain';
import { GenerateurIdentifiants } from '../ports/generateur-identifiants';

/** Renvoie toujours les mêmes identifiants : les tests restent déterministes. */
export class GenerateurIdentifiantsFixe extends GenerateurIdentifiants {
  private readonly utilisateurId: UtilisateurId;

  constructor(identifiants: { utilisateurId?: UtilisateurId } = {}) {
    super();
    this.utilisateurId =
      identifiants.utilisateurId ??
      UtilisateurId.creer('3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b');
  }

  nouvelUtilisateurId(): UtilisateurId {
    return this.utilisateurId;
  }
}
