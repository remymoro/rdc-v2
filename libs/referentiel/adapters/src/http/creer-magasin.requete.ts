import type { CreerMagasinCommande } from '@rdc/referentiel-application';
import {
  Adresse,
  CentreId,
  CodePostal,
  Email,
  Nom,
  Telephone,
  Ville,
} from '@rdc/referentiel-domain';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { videVersAbsent } from './champ-facultatif';

/**
 * Corps de POST /api/centres/:centreId/magasins. Ne vérifie que la FORME
 * (présence, texte) : les règles métier restent dans les value objects
 * (TENETS-VALIDATE-002).
 */
export class CreerMagasinRequete {
  @IsString({
    message: 'Le nom du magasin est obligatoire et doit être un texte.',
  })
  nom!: string;

  @IsString({ message: 'La ville est obligatoire et doit être un texte.' })
  ville!: string;

  @IsString({
    message: 'Le code postal est obligatoire et doit être un texte.',
  })
  codePostal!: string;

  @IsString({ message: "L'adresse est obligatoire et doit être un texte." })
  adresse!: string;

  @Transform(videVersAbsent)
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être un texte.' })
  telephone?: string;

  @Transform(videVersAbsent)
  @IsOptional()
  @IsString({ message: "L'e-mail doit être un texte." })
  email?: string;
}

/**
 * Paramètre :centreId et corps → commande applicative ; le domaine valide
 * chaque valeur, identifiant du centre compris (pas de ParseUUIDPipe).
 */
export function versCreerMagasinCommande(
  centreId: string,
  requete: CreerMagasinRequete,
): CreerMagasinCommande {
  return {
    centreId: CentreId.creer(centreId),
    nom: Nom.creer(requete.nom),
    adresse: Adresse.creer(requete.adresse),
    codePostal: CodePostal.creer(requete.codePostal),
    ville: Ville.creer(requete.ville),
    telephone:
      requete.telephone === undefined
        ? undefined
        : Telephone.creer(requete.telephone),
    email: requete.email === undefined ? undefined : Email.creer(requete.email),
  };
}
