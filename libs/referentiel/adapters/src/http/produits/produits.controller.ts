import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';
import {
  ActiverProduitUseCase,
  CreerProduitUseCase,
  DesactiverProduitUseCase,
  ListerProduitsQuery,
  ModifierProduitUseCase,
} from '@rdc/referentiel-application';
import {
  type ProduitReponse,
  versProduitReponse,
  vueVersProduitReponse,
} from './reponses/produit.reponse';
import {
  CreerProduitRequete,
  ModifierProduitRequete,
  versChangerActiviteProduitCommande,
  versCreerProduitCommande,
  versModifierProduitCommande,
} from './requetes/produit.requetes';
import { ReferentielErreursHttpFilter } from '../commun/filtres/referentiel-erreurs-http.filter';

/**
 * Adapter primaire du catalogue (contrat v1, ADR-0009) : traduit HTTP → use
 * case → HTTP, sans logique métier. Non protégé avant l'étape 4.
 */
@Controller('produits')
@UseFilters(ReferentielErreursHttpFilter)
export class ProduitsController {
  constructor(
    private readonly creerProduit: CreerProduitUseCase,
    private readonly modifierProduit: ModifierProduitUseCase,
    private readonly activerProduit: ActiverProduitUseCase,
    private readonly desactiverProduit: DesactiverProduitUseCase,
    private readonly listerProduits: ListerProduitsQuery,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async creer(@Body() requete: CreerProduitRequete): Promise<ProduitReponse> {
    const produit = await this.creerProduit.execute(
      versCreerProduitCommande(requete),
    );
    return versProduitReponse(produit);
  }

  @Get()
  async lister(): Promise<ProduitReponse[]> {
    const vues = await this.listerProduits.execute();
    return vues.map(vueVersProduitReponse);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async modifier(
    @Param('id') id: string,
    @Body() requete: ModifierProduitRequete,
  ): Promise<ProduitReponse> {
    const produit = await this.modifierProduit.execute(
      versModifierProduitCommande(id, requete),
    );
    return versProduitReponse(produit);
  }

  @Patch(':id/activer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activer(@Param('id') id: string): Promise<void> {
    await this.activerProduit.execute(versChangerActiviteProduitCommande(id));
  }

  @Patch(':id/desactiver')
  @HttpCode(HttpStatus.NO_CONTENT)
  async desactiver(@Param('id') id: string): Promise<void> {
    await this.desactiverProduit.execute(
      versChangerActiviteProduitCommande(id),
    );
  }
}
