import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import {
  ActiverCentreUseCase,
  ArchiverCentreUseCase,
  CreerCentreUseCase,
  DesactiverCentreUseCase,
  ListerCentresQuery,
  ObtenirCentreQuery,
} from '@rdc/referentiel-application';
import {
  type CentreLuReponse,
  type CentreReponse,
  versCentreReponse,
  vueVersCentreReponse,
} from './centre.reponse';
import {
  CreerCentreRequete,
  versCreerCentreCommande,
} from './creer-centre.requete';
import {
  versActiverCentreCommande,
  versArchiverCentreCommande,
  versDesactiverCentreCommande,
} from './cycle-de-vie-centre.requete';
import {
  LireCentresRequete,
  versListerCentresRequete,
  versObtenirCentreRequete,
} from './lire-centres.requete';
import { ReferentielErreursHttpFilter } from './referentiel-erreurs-http.filter';

/**
 * Adapter primaire : traduit HTTP → use case → HTTP, sans logique métier
 * (TENETS-ADAPTER-001). Routes non protégées tant que l'authentification
 * (étape 4) n'existe pas : ne pas déployer avant (ADR-0009).
 */
@Controller('centres')
@UseFilters(ReferentielErreursHttpFilter)
export class CentresController {
  constructor(
    private readonly creerCentre: CreerCentreUseCase,
    private readonly desactiverCentre: DesactiverCentreUseCase,
    private readonly activerCentre: ActiverCentreUseCase,
    private readonly archiverCentre: ArchiverCentreUseCase,
    private readonly listerCentres: ListerCentresQuery,
    private readonly obtenirCentre: ObtenirCentreQuery,
  ) {}

  @Get()
  async lister(
    @Query() requete: LireCentresRequete,
  ): Promise<CentreLuReponse[]> {
    const vues = await this.listerCentres.execute(
      versListerCentresRequete(requete),
    );
    return vues.map(vueVersCentreReponse);
  }

  @Get(':id')
  async obtenir(@Param('id') id: string): Promise<CentreLuReponse> {
    const vue = await this.obtenirCentre.execute(versObtenirCentreRequete(id));
    return vueVersCentreReponse(vue);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async creer(@Body() requete: CreerCentreRequete): Promise<CentreReponse> {
    const centre = await this.creerCentre.execute(
      versCreerCentreCommande(requete),
    );
    return versCentreReponse(centre);
  }

  // Cycle de vie (contrat v1, ADR-0009) : corps ignoré, 204 sans corps.

  @Patch(':id/desactiver')
  @HttpCode(HttpStatus.NO_CONTENT)
  async desactiver(@Param('id') id: string): Promise<void> {
    await this.desactiverCentre.execute(versDesactiverCentreCommande(id));
  }

  @Patch(':id/activer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activer(@Param('id') id: string): Promise<void> {
    await this.activerCentre.execute(versActiverCentreCommande(id));
  }

  @Patch(':id/archiver')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiver(@Param('id') id: string): Promise<void> {
    await this.archiverCentre.execute(versArchiverCentreCommande(id));
  }
}
