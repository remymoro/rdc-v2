import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ImageTropVolumineuse } from '@rdc/referentiel-domain';
import { envoyerErreur } from '@rdc/shared-kernel-adapters';

/**
 * Multer arrête la lecture d'un fichier au-delà de 5 Mo, avant le domaine, et
 * lève PayloadTooLargeException. Sur la route d'ajout d'une image, ce refus
 * est le même que celui du domaine : 413 IMAGE_TROP_VOLUMINEUSE.
 */
@Catch(PayloadTooLargeException)
export class TeleversementImageFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, hote: ArgumentsHost): void {
    const erreur = new ImageTropVolumineuse();
    envoyerErreur(hote, {
      statut: HttpStatus.PAYLOAD_TOO_LARGE,
      nom: erreur.name,
      message: erreur.message,
      code: erreur.code,
    });
  }
}
