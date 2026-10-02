import type {
  ListerCentresRequete,
  ObtenirCentreRequete,
} from '@rdc/referentiel-application';
import { CentreId, StatutCentre } from '@rdc/referentiel-domain';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Paramètres de GET /api/centres. Forme seulement : un statut connu, une
 * recherche de texte raisonnable (TENETS-VALIDATE-002).
 */
export class LireCentresRequete {
  @IsOptional()
  @IsIn(Object.values(StatutCentre), {
    message: 'Le statut doit valoir ACTIF, INACTIF ou ARCHIVE.',
  })
  statut?: string;

  @IsOptional()
  @IsString({ message: 'La recherche doit être un texte.' })
  @MaxLength(100, {
    message: 'La recherche ne dépasse pas 100 caractères.',
  })
  recherche?: string;
}

export function versListerCentresRequete(
  requete: LireCentresRequete,
): ListerCentresRequete {
  return {
    ...(requete.statut !== undefined && {
      statut: requete.statut as StatutCentre,
    }),
    ...(requete.recherche !== undefined && { recherche: requete.recherche }),
  };
}

export function versObtenirCentreRequete(id: string): ObtenirCentreRequete {
  return { centreId: CentreId.creer(id) };
}
