import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { envoyerErreur } from '@rdc/shared-kernel-adapters';

const CODES_HTTP: Partial<Record<number, string>> = {
  [HttpStatus.UNAUTHORIZED]: 'AUTHENTICATION_REQUIRED',
  [HttpStatus.FORBIDDEN]: 'ACCESS_FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
};

/**
 * Frontière de sécurité externe de l'API (TENETS-ERROR-007) :
 * - requête mal formée (ValidationPipe) → 400 REQUEST_VALIDATION (format v1) ;
 * - autres HttpException → leur statut, codes de la v1 ;
 * - tout le reste → 500 INTERNAL_ERROR, journalisé une fois, sans détail.
 * Les erreurs métier connues sont traduites avant par le filtre de leur contexte.
 */
@Catch()
export class ErreursHttpGlobalesFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErreursHttpGlobalesFilter.name);

  catch(exception: unknown, hote: ArgumentsHost): void {
    if (exception instanceof BadRequestException) {
      envoyerErreur(hote, {
        statut: HttpStatus.BAD_REQUEST,
        nom: 'RequestValidationException',
        message: extraireMessage(exception),
        code: 'REQUEST_VALIDATION',
      });
      return;
    }

    if (exception instanceof HttpException) {
      const statut = exception.getStatus();
      envoyerErreur(hote, {
        statut,
        nom: exception.name,
        message: extraireMessage(exception),
        code: CODES_HTTP[statut] ?? 'HTTP_EXCEPTION',
      });
      return;
    }

    this.logger.error(
      'Erreur inattendue',
      exception instanceof Error ? exception.stack : String(exception),
    );
    envoyerErreur(hote, {
      statut: HttpStatus.INTERNAL_SERVER_ERROR,
      nom: 'InternalServerError',
      message: 'Une erreur interne est survenue.',
      code: 'INTERNAL_ERROR',
    });
  }
}

/** Message lisible, messages multiples du ValidationPipe réunis (comme la v1). */
function extraireMessage(exception: HttpException): string {
  const contenu = exception.getResponse();
  if (typeof contenu === 'string') {
    return contenu;
  }
  const message = (contenu as { message?: unknown }).message;
  if (Array.isArray(message)) {
    return [
      ...new Set(message.filter((m): m is string => typeof m === 'string')),
    ].join(' ');
  }
  return typeof message === 'string' ? message : exception.message;
}
