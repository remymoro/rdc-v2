import type {
  ChangerActiviteProduitCommande,
  CreerProduitCommande,
  ModifierProduitCommande,
} from '@rdc/referentiel-application';
import {
  CodeProduit,
  Famille,
  ProduitId,
  SousFamille,
} from '@rdc/referentiel-domain';
import { IsString, ValidateIf } from 'class-validator';

/**
 * Corps de POST /api/produits. Forme seulement : les règles (code « D » +
 * 6 chiffres, champs non vides) restent dans les value objects.
 */
export class CreerProduitRequete {
  @IsString({
    message: 'Le code du produit est obligatoire et doit être un texte.',
  })
  code!: string;

  @IsString({ message: 'La famille est obligatoire et doit être un texte.' })
  famille!: string;

  @IsString({
    message: 'La sous-famille est obligatoire et doit être un texte.',
  })
  sousFamille!: string;
}

/** Corps de PATCH /api/produits/:id : champ absent = inchangé. */
export class ModifierProduitRequete {
  @ValidateIf((o: ModifierProduitRequete) => o.code !== undefined)
  @IsString({ message: 'Le code du produit doit être un texte.' })
  code?: string;

  @ValidateIf((o: ModifierProduitRequete) => o.famille !== undefined)
  @IsString({ message: 'La famille doit être un texte.' })
  famille?: string;

  @ValidateIf((o: ModifierProduitRequete) => o.sousFamille !== undefined)
  @IsString({ message: 'La sous-famille doit être un texte.' })
  sousFamille?: string;
}

export function versCreerProduitCommande(
  requete: CreerProduitRequete,
): CreerProduitCommande {
  return {
    code: CodeProduit.creer(requete.code),
    famille: Famille.creer(requete.famille),
    sousFamille: SousFamille.creer(requete.sousFamille),
  };
}

export function versModifierProduitCommande(
  id: string,
  requete: ModifierProduitRequete,
): ModifierProduitCommande {
  return {
    produitId: ProduitId.creer(id),
    changements: {
      // Un nouveau code suit le format strict, comme à la création.
      ...(requete.code !== undefined && {
        code: CodeProduit.creer(requete.code),
      }),
      ...(requete.famille !== undefined && {
        famille: Famille.creer(requete.famille),
      }),
      ...(requete.sousFamille !== undefined && {
        sousFamille: SousFamille.creer(requete.sousFamille),
      }),
    },
  };
}

export function versChangerActiviteProduitCommande(
  id: string,
): ChangerActiviteProduitCommande {
  return { produitId: ProduitId.creer(id) };
}
