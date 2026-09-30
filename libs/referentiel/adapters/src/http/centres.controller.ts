import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
} from '@nestjs/common';
import { CreerCentreUseCase } from '@rdc/referentiel-application';
import { type CentreReponse, versCentreReponse } from './centre.reponse';
import {
  CreerCentreRequete,
  versCreerCentreCommande,
} from './creer-centre.requete';
import { ReferentielErreursHttpFilter } from './referentiel-erreurs-http.filter';

/**
 * Adapter primaire : traduit HTTP → use case → HTTP, sans logique métier
 * (TENETS-ADAPTER-001). Route non protégée tant que l'authentification
 * (étape 4) n'existe pas : ne pas déployer avant (ADR-0009).
 */
@Controller('centres')
@UseFilters(ReferentielErreursHttpFilter)
export class CentresController {
  constructor(private readonly creerCentre: CreerCentreUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async creer(@Body() requete: CreerCentreRequete): Promise<CentreReponse> {
    const centre = await this.creerCentre.execute(
      versCreerCentreCommande(requete),
    );
    return versCentreReponse(centre);
  }
}
