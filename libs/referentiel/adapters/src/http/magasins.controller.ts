import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ActiverMagasinUseCase,
  AjouterImageMagasinUseCase,
  ArchiverMagasinUseCase,
  CreerMagasinUseCase,
  DesactiverMagasinUseCase,
  ListerMagasinsDuCentreQuery,
  ListerMagasinsQuery,
  ModifierMagasinUseCase,
  ObtenirMagasinQuery,
  RetirerImageMagasinUseCase,
} from '@rdc/referentiel-application';
import { TAILLE_MAXIMALE_IMAGE } from '@rdc/referentiel-domain';
import {
  CreerMagasinRequete,
  versCreerMagasinCommande,
} from './creer-magasin.requete';
import {
  versActiverMagasinCommande,
  versArchiverMagasinCommande,
  versDesactiverMagasinCommande,
} from './cycle-de-vie-magasin.requete';
import {
  versListerMagasinsDuCentreRequete,
  versObtenirMagasinRequete,
} from './lire-magasins.requete';
import {
  type FichierTeleverse,
  versAjouterImageMagasinCommande,
  versRetirerImageMagasinCommande,
} from './images-magasin.requete';
import {
  type ImageMagasinReponse,
  type MagasinReponse,
  versImageMagasinReponse,
  versMagasinReponse,
  vueVersMagasinReponse,
} from './magasin.reponse';
import {
  ModifierMagasinRequete,
  versModifierMagasinCommande,
} from './modifier-magasin.requete';
import { ReferentielErreursHttpFilter } from './referentiel-erreurs-http.filter';
import { TeleversementImageFilter } from './televersement-image.filter';

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
    private readonly listerMagasins: ListerMagasinsQuery,
    private readonly listerMagasinsDuCentre: ListerMagasinsDuCentreQuery,
    private readonly obtenirMagasin: ObtenirMagasinQuery,
    private readonly ajouterImage: AjouterImageMagasinUseCase,
    private readonly retirerImage: RetirerImageMagasinUseCase,
  ) {}

  // Lectures (contrat v1, ADR-0009). Pas encore de filtre « son centre » :
  // il dépend du jeton et arrive à l'étape 4.
  @Get('magasins')
  async lister(): Promise<MagasinReponse[]> {
    const vues = await this.listerMagasins.execute();
    return vues.map(vueVersMagasinReponse);
  }

  @Get('centres/:centreId/magasins')
  async listerDuCentre(
    @Param('centreId') centreId: string,
  ): Promise<MagasinReponse[]> {
    const vues = await this.listerMagasinsDuCentre.execute(
      versListerMagasinsDuCentreRequete(centreId),
    );
    return vues.map(vueVersMagasinReponse);
  }

  @Get('magasins/:id')
  async obtenir(@Param('id') id: string): Promise<MagasinReponse> {
    const vue = await this.obtenirMagasin.execute(
      versObtenirMagasinRequete(id),
    );
    return vueVersMagasinReponse(vue);
  }

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

  // Images (contrat v1, ADR-0009, RDC-REF-007). Multer garde le fichier en
  // mémoire et s'arrête au-delà de 5 Mo ; taille et format sont vérifiés par
  // le domaine, sur le contenu.
  @Post('magasins/:id/images')
  @HttpCode(HttpStatus.CREATED)
  @UseFilters(TeleversementImageFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: TAILLE_MAXIMALE_IMAGE,
        files: 1,
        fields: 0,
        parts: 1,
        headerPairs: 100,
      },
    }),
  )
  async ajouterUneImage(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    fichier: FichierTeleverse,
  ): Promise<ImageMagasinReponse> {
    const commande = versAjouterImageMagasinCommande(id, fichier);
    const image = await this.ajouterImage.execute(commande);
    return versImageMagasinReponse(commande.magasinId, image);
  }

  @Delete('magasins/:id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async retirerUneImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    await this.retirerImage.execute(
      versRetirerImageMagasinCommande(id, imageId),
    );
  }
}
