import type { ArgumentsHost } from '@nestjs/common';

export interface ErreurHttp {
  readonly statut: number;
  /** Nom de l'erreur (champ « error »), informatif : le front ne le lit pas. */
  readonly nom: string;
  readonly message: string;
  /** Code stable lu par le front (ex. CENTRE_ALREADY_EXISTS). */
  readonly code: string;
}

interface ReponseHttp {
  status(statut: number): { json(corps: unknown): void };
}

/**
 * Seule définition du format d'erreur HTTP de RDC (repris de la v1) :
 * { statusCode, error, message, code, path, timestamp }.
 */
export function envoyerErreur(hote: ArgumentsHost, erreur: ErreurHttp): void {
  const http = hote.switchToHttp();
  http.getResponse<ReponseHttp>().status(erreur.statut).json({
    statusCode: erreur.statut,
    error: erreur.nom,
    message: erreur.message,
    code: erreur.code,
    path: http.getRequest<{ url: string }>().url,
    timestamp: new Date().toISOString(),
  });
}
