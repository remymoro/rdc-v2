import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';
import {
  ActiverMagasinUseCase,
  ArchiverMagasinUseCase,
  CreerMagasinUseCase,
  DesactiverMagasinUseCase,
  ModifierMagasinUseCase,
} from '@rdc/referentiel-application';
import {
  CreerMagasinRequete,
  versCreerMagasinCommande,
} from './creer-magasin.requete';
import {
  versActiverMagasinCommande,
  versArchiverMagasinCommande,
  versDesactiverMagasinCommande,
} from './cycle-de-vie-magasin.requete';
import { type MagasinReponse, versMagasinReponse } from './magasin.reponse';
import {
  ModifierMagasinRequete,
  versModifierMagasinCommande,
} from './modifier-magasin.requete';
import { ReferentielErreursHttpFilter } from './referentiel-erreurs-http.filter';

/**
 * Adapter primaire des magasins : traduit HTTP → use case → HTTP, sans
 * logique métier (TENETS-ADAPTER-001). Routes du contrat v1 (ADR-0009), non
 * protégées tant que l'authentification (étape 4) n'existe pas.
 */
@Controller()
@UseFilters(ReferentielErreursHttpFilter)
export class MagasinsController {
  constructor(
    private readonly creerMagasin: CreerMagasinUseCase,
    private readonly desactiverMagasin: DesactiverMagasinUseCase,
    private readonly activerMagasin: ActiverMagasinUseCase,
    private readonly archiverMagasin: ArchiverMagasinUseCase,
    private readonly modifierMagasin: ModifierMagasinUseCase,
  ) {}

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

  // Modification et transfert (contrat v1, ADR-0009) : 200 MagasinDto.
  @Patch('magasins/:id')
  @HttpCode(HttpStatus.OK)
  async modifier(
    @Param('id') id: string,
    @Body() requete: ModifierMagasinRequete,
  ): Promise<MagasinReponse> {
    const magasin = await this.modifierMagasin.execute(
      versModifierMagasinCommande(id, requete),
    );
    return versMagasinReponse(magasin);
  }

  // Cycle de vie (contrat v1, ADR-0009) : corps ignoré, 204 sans corps.
  @Patch('magasins/:id/desactiver')
  @HttpCode(HttpStatus.NO_CONTENT)
  async desactiver(@Param('id') id: string): Promise<void> {
    await this.desactiverMagasin.execute(versDesactiverMagasinCommande(id));
  }

  @Patch('magasins/:id/activer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activer(@Param('id') id: string): Promise<void> {
    await this.activerMagasin.execute(versActiverMagasinCommande(id));
  }

  @Patch('magasins/:id/archiver')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiver(@Param('id') id: string): Promise<void> {
    await this.archiverMagasin.execute(versArchiverMagasinCommande(id));
  }
}
