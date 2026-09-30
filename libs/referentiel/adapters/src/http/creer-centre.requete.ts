import type { CreerCentreCommande } from '@rdc/referentiel-application';
import {
  Adresse,
  CodePostal,
  Email,
  Nom,
  Telephone,
  Ville,
} from '@rdc/referentiel-domain';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

/** "" ou espaces → absent : un champ facultatif vide n'est pas renseigné (ADR-0007). */
function videVersAbsent({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.trim().length === 0
    ? undefined
    : value;
}

/**
 * Corps de POST /api/centres. Ne vérifie que la FORME (présence, texte) :
 * les règles métier restent dans les value objects (TENETS-VALIDATE-002).
 */
export class CreerCentreRequete {
  @IsString({
    message: 'Le nom du centre est obligatoire et doit être un texte.',
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

/** Requête HTTP → commande applicative ; le domaine valide chaque valeur. */
export function versCreerCentreCommande(
  requete: CreerCentreRequete,
): CreerCentreCommande {
  return {
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
