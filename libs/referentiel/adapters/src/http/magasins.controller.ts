import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';
import { CreerMagasinUseCase } from '@rdc/referentiel-application';
import {
  CreerMagasinRequete,
  versCreerMagasinCommande,
} from './creer-magasin.requete';
import { type MagasinReponse, versMagasinReponse } from './magasin.reponse';
import { ReferentielErreursHttpFilter } from './referentiel-erreurs-http.filter';

/**
 * Adapter primaire des magasins : traduit HTTP → use case → HTTP, sans
 * logique métier (TENETS-ADAPTER-001). Routes du contrat v1 (ADR-0009), non
 * protégées tant que l'authentification (étape 4) n'existe pas.
 */
@Controller()
@UseFilters(ReferentielErreursHttpFilter)
export class MagasinsController {
  constructor(private readonly creerMagasin: CreerMagasinUseCase) {}

  @Post('centres/:centreId/magasins')
  @HttpCode(HttpStatus.CREATED)
  async creer(
    @Param('centreId') centreId: string,
    @Body() requete: CreerMagasinRequete,
  ): Promise<MagasinReponse> {
    const magasin = await this.creerMagasin.execute(
      versCreerMagasinCommande(centreId, requete),
    );
    return versMagasinReponse(magasin);
  }
}
