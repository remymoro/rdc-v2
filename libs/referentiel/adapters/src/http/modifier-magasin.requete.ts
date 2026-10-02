import type { ModifierMagasinCommande } from '@rdc/referentiel-application';
import {
  Adresse,
  CentreId,
  CodePostal,
  Email,
  MagasinId,
  Nom,
  Telephone,
  Ville,
} from '@rdc/referentiel-domain';
import { Transform } from 'class-transformer';
import { IsString, ValidateIf } from 'class-validator';
import { videVersSuppression } from './champ-facultatif';

const fourni =
  (champ: keyof ModifierMagasinRequete) => (o: ModifierMagasinRequete) =>
    o[champ] !== undefined;
const renseigne =
  (champ: 'telephone' | 'email') => (o: ModifierMagasinRequete) =>
    o[champ] !== undefined && o[champ] !== null;

/**
 * Corps de PATCH /api/magasins/:id (contrat v1) : champ absent = inchangé ;
 * `null` = suppression, pour le téléphone et l'email seulement. Ne vérifie que
 * la FORME : les règles restent dans les value objects (TENETS-VALIDATE-002).
 */
export class ModifierMagasinRequete {
  @ValidateIf(fourni('nom'))
  @IsString({ message: 'Le nom du magasin doit être un texte.' })
  nom?: string;

  @ValidateIf(fourni('ville'))
  @IsString({ message: 'La ville doit être un texte.' })
  ville?: string;

  @ValidateIf(fourni('codePostal'))
  @IsString({ message: 'Le code postal doit être un texte.' })
  codePostal?: string;

  @ValidateIf(fourni('adresse'))
  @IsString({ message: "L'adresse doit être un texte." })
  adresse?: string;

  @Transform(videVersSuppression)
  @ValidateIf(renseigne('telephone'))
  @IsString({ message: 'Le téléphone doit être un texte ou null.' })
  telephone?: string | null;

  @Transform(videVersSuppression)
  @ValidateIf(renseigne('email'))
  @IsString({ message: "L'e-mail doit être un texte ou null." })
  email?: string | null;

  @ValidateIf(fourni('centreId'))
  @IsString({ message: "L'identifiant du centre doit être un texte." })
  centreId?: string;
}

/** Paramètre :id et corps → commande ; le domaine valide chaque valeur. */
export function versModifierMagasinCommande(
  id: string,
  requete: ModifierMagasinRequete,
): ModifierMagasinCommande {
  return {
    magasinId: MagasinId.creer(id),
    changements: {
      ...(requete.nom !== undefined && { nom: Nom.creer(requete.nom) }),
      ...(requete.adresse !== undefined && {
        adresse: Adresse.creer(requete.adresse),
      }),
      ...(requete.codePostal !== undefined && {
        codePostal: CodePostal.creer(requete.codePostal),
      }),
      ...(requete.ville !== undefined && { ville: Ville.creer(requete.ville) }),
      ...(requete.telephone !== undefined && {
        telephone:
          requete.telephone === null
            ? null
            : Telephone.creer(requete.telephone),
      }),
      ...(requete.email !== undefined && {
        email: requete.email === null ? null : Email.creer(requete.email),
      }),
    },
    ...(requete.centreId !== undefined && {
      centreId: CentreId.creer(requete.centreId),
    }),
  };
}
