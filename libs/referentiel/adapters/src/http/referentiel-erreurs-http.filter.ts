import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Type,
} from '@nestjs/common';
import {
  CentreDejaExistant,
  CentreIntrouvable,
} from '@rdc/referentiel-application';
import {
  AdresseAbreviationInterdite,
  AdresseTropLongue,
  AdresseVide,
  CentreArchive,
  CentreIdInvalide,
  CentreIdVide,
  CodePostalInvalide,
  EmailInvalide,
  EmailTropLong,
  EmailVide,
  NomTropLong,
  NomVide,
  TelephoneInvalide,
  TelephoneVide,
  VilleTropLongue,
  VilleVide,
} from '@rdc/referentiel-domain';
import { envoyerErreur } from '@rdc/shared-kernel-adapters';

type ErreurConnue = Error & { readonly code: string };

/**
 * Seul endroit où les erreurs connues du contexte deviennent des statuts HTTP
 * (TENETS-ERROR-006). Statuts identiques à RDC v1 : validation 400, centre
 * introuvable 404, conflit (doublon, centre archivé) 409.
 */
const STATUTS_HTTP = new Map<Type<ErreurConnue>, HttpStatus>([
  [CentreDejaExistant, HttpStatus.CONFLICT],
  [CentreIntrouvable, HttpStatus.NOT_FOUND],
  [CentreArchive, HttpStatus.CONFLICT],
  [NomVide, HttpStatus.BAD_REQUEST],
  [NomTropLong, HttpStatus.BAD_REQUEST],
  [CentreIdVide, HttpStatus.BAD_REQUEST],
  [CentreIdInvalide, HttpStatus.BAD_REQUEST],
  [CodePostalInvalide, HttpStatus.BAD_REQUEST],
  [VilleVide, HttpStatus.BAD_REQUEST],
  [VilleTropLongue, HttpStatus.BAD_REQUEST],
  [AdresseVide, HttpStatus.BAD_REQUEST],
  [AdresseTropLongue, HttpStatus.BAD_REQUEST],
  [AdresseAbreviationInterdite, HttpStatus.BAD_REQUEST],
  [TelephoneVide, HttpStatus.BAD_REQUEST],
  [TelephoneInvalide, HttpStatus.BAD_REQUEST],
  [EmailVide, HttpStatus.BAD_REQUEST],
  [EmailTropLong, HttpStatus.BAD_REQUEST],
  [EmailInvalide, HttpStatus.BAD_REQUEST],
]);

/**
 * `@Catch` filtre par `instanceof` : une sous-classe d'une erreur listée arrive
 * ici. On remonte donc sa chaîne de prototypes jusqu'au type déclaré. Ne rien
 * trouver serait un bug du filtre : 500, jamais un 400 trompeur.
 */
function statutHttp(erreur: ErreurConnue): HttpStatus {
  for (
    let type = Object.getPrototypeOf(erreur);
    type !== null;
    type = Object.getPrototypeOf(type)
  ) {
    const statut = STATUTS_HTTP.get(type.constructor);
    if (statut !== undefined) {
      return statut;
    }
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

@Catch(...STATUTS_HTTP.keys())
export class ReferentielErreursHttpFilter
  implements ExceptionFilter<ErreurConnue>
{
  catch(erreur: ErreurConnue, hote: ArgumentsHost): void {
    envoyerErreur(hote, {
      statut: statutHttp(erreur),
      nom: erreur.name,
      message: erreur.message,
      code: erreur.code,
    });
  }
}
