import type { CentreId } from '../centre/centre-id';
import type { Adresse } from '../commun/adresse';
import type { CodePostal } from '../commun/code-postal';
import type { Email } from '../commun/email';
import type { Nom } from '../commun/nom';
import type { Telephone } from '../commun/telephone';
import type { Ville } from '../commun/ville';
import { ImageMagasin, type NouvelleImageMagasin } from './image/image-magasin';
import type { ImageMagasinId } from './image/image-magasin-id';
import type { MagasinId } from './magasin-id';
import {
  MagasinArchive,
  MagasinImageDejaPresente,
  MagasinImageIntrouvable,
} from './magasin.errors';
import { StatutMagasin } from './statut-magasin';

/** État initial complet d'un nouveau magasin (TENETS-LIFECYCLE-003). */
export interface NouveauMagasin {
  readonly id: MagasinId;
  readonly nom: Nom;
  readonly adresse: Adresse;
  readonly codePostal: CodePostal;
  readonly ville: Ville;
  /** Centre de rattachement permanent (RDC-REF-005). */
  readonly centreId: CentreId;
  /** Facultatif : absent = pas de téléphone (ADR-0007). */
  readonly telephone?: Telephone;
  /** Facultatif : absent = pas d'email (ADR-0007). */
  readonly email?: Email;
}

/** État persisté complet d'un magasin existant (TENETS-LIFECYCLE-005). */
export interface EtatMagasin extends NouveauMagasin {
  readonly statut: StatutMagasin;
  /** Images du magasin, dans n'importe quel ordre : l'agrégat les trie. */
  readonly images: readonly ImageMagasin[];
  readonly creeLe: Date;
  readonly modifieLe: Date;
}

/**
 * Changements demandés sur un magasin : champ absent = inchangé ; `null` =
 * suppression, pour le téléphone et l'email seulement (convention v1).
 * Les valeurs sont déjà validées par leurs value objects (TENETS-VALIDATE-001).
 */
export interface ModificationsMagasin {
  readonly nom?: Nom;
  readonly adresse?: Adresse;
  readonly codePostal?: CodePostal;
  readonly ville?: Ville;
  readonly telephone?: Telephone | null;
  readonly email?: Email | null;
}

export class Magasin {
  private constructor(
    readonly id: MagasinId,
    private nomActuel: Nom,
    private adresseActuelle: Adresse,
    private codePostalActuel: CodePostal,
    private villeActuelle: Ville,
    private centreActuel: CentreId,
    private telephoneActuel: Telephone | undefined,
    private emailActuel: Email | undefined,
    private statutActuel: StatutMagasin,
    private imagesActuelles: ImageMagasin[],
    readonly creeLe: Date,
    private derniereModification: Date,
  ) {}

  get nom(): Nom {
    return this.nomActuel;
  }

  get adresse(): Adresse {
    return this.adresseActuelle;
  }

  get codePostal(): CodePostal {
    return this.codePostalActuel;
  }

  get ville(): Ville {
    return this.villeActuelle;
  }

  /** Centre de rattachement permanent (RDC-REF-005). */
  get centreId(): CentreId {
    return this.centreActuel;
  }

  get telephone(): Telephone | undefined {
    return this.telephoneActuel;
  }

  get email(): Email | undefined {
    return this.emailActuel;
  }

  get statut(): StatutMagasin {
    return this.statutActuel;
  }

  get modifieLe(): Date {
    return this.derniereModification;
  }

  /** Images du magasin, dans leur ordre d'affichage (RDC-REF-007). */
  get images(): readonly ImageMagasin[] {
    return [...this.imagesActuelles];
  }

  /** Nouveau magasin : le statut initial est décidé ici (TENETS-LIFECYCLE-004). */
  static creer(nouveau: NouveauMagasin, maintenant: Date): Magasin {
    return new Magasin(
      nouveau.id,
      nouveau.nom,
      nouveau.adresse,
      nouveau.codePostal,
      nouveau.ville,
      nouveau.centreId,
      nouveau.telephone,
      nouveau.email,
      StatutMagasin.ACTIF,
      [],
      maintenant,
      maintenant,
    );
  }

  /**
   * Magasin existant, relu depuis la base : l'état persisté est restitué tel
   * quel, sans statut initial ni date par défaut (TENETS-LIFECYCLE-005).
   */
  static reconstituer(etat: EtatMagasin): Magasin {
    return new Magasin(
      etat.id,
      etat.nom,
      etat.adresse,
      etat.codePostal,
      etat.ville,
      etat.centreId,
      etat.telephone,
      etat.email,
      etat.statut,
      trierParOrdre(etat.images),
      etat.creeLe,
      etat.modifieLe,
    );
  }

  /** Met le magasin en pause : il ne participe plus aux nouvelles opérations. */
  desactiver(maintenant: Date): void {
    this.verifierModifiable();

    if (this.statutActuel === StatutMagasin.INACTIF) {
      return;
    }

    this.statutActuel = StatutMagasin.INACTIF;
    this.derniereModification = maintenant;
  }

  /** Remet en service un magasin précédemment désactivé. */
  activer(maintenant: Date): void {
    this.verifierModifiable();

    if (this.statutActuel === StatutMagasin.ACTIF) {
      return;
    }

    this.statutActuel = StatutMagasin.ACTIF;
    this.derniereModification = maintenant;
  }

  /** Retire définitivement le magasin : il ne pourra plus changer d'état. */
  archiver(maintenant: Date): void {
    if (this.statutActuel === StatutMagasin.ARCHIVE) {
      return;
    }

    this.statutActuel = StatutMagasin.ARCHIVE;
    this.derniereModification = maintenant;
  }

  /**
   * Modifie l'identité ou les contacts du magasin. Une modification identique
   * ne change pas `modifieLe`. Un magasin archivé ne se modifie plus.
   */
  modifier(changements: ModificationsMagasin, maintenant: Date): void {
    this.verifierModifiable();
    let modifie = false;

    if (changements.nom && changements.nom.valeur !== this.nomActuel.valeur) {
      this.nomActuel = changements.nom;
      modifie = true;
    }
    if (
      changements.adresse &&
      changements.adresse.valeur !== this.adresseActuelle.valeur
    ) {
      this.adresseActuelle = changements.adresse;
      modifie = true;
    }
    if (
      changements.codePostal &&
      changements.codePostal.valeur !== this.codePostalActuel.valeur
    ) {
      this.codePostalActuel = changements.codePostal;
      modifie = true;
    }
    if (
      changements.ville &&
      changements.ville.valeur !== this.villeActuelle.valeur
    ) {
      this.villeActuelle = changements.ville;
      modifie = true;
    }
    if (
      changements.telephone !== undefined &&
      changements.telephone?.valeur !== this.telephoneActuel?.valeur
    ) {
      this.telephoneActuel = changements.telephone ?? undefined;
      modifie = true;
    }
    if (
      changements.email !== undefined &&
      changements.email?.valeur !== this.emailActuel?.valeur
    ) {
      this.emailActuel = changements.email ?? undefined;
      modifie = true;
    }

    if (modifie) {
      this.derniereModification = maintenant;
    }
  }

  /**
   * Change le centre de rattachement permanent (RDC-REF-005). Le use case
   * vérifie que le centre cible existe et est actif (RDC-REF-010).
   */
  transfererVers(centreId: CentreId, maintenant: Date): void {
    this.verifierModifiable();
    if (centreId.equals(this.centreActuel)) {
      return;
    }
    this.centreActuel = centreId;
    this.derniereModification = maintenant;
  }

  /**
   * Ajoute une image après les autres (RDC-REF-007). Le fichier est déjà
   * nommé par le use case, jamais d'après le nom envoyé par le client.
   */
  ajouterImage(nouvelle: NouvelleImageMagasin, maintenant: Date): ImageMagasin {
    this.verifierModifiable();
    if (this.imagesActuelles.some((image) => image.id.equals(nouvelle.id))) {
      throw new MagasinImageDejaPresente(nouvelle.id);
    }

    const image = ImageMagasin.creer(nouvelle, this.ordreSuivant(), maintenant);
    this.imagesActuelles.push(image);
    this.derniereModification = maintenant;
    return image;
  }

  /**
   * Retire une image du magasin et la renvoie : son fichier reste à supprimer
   * par le use case, une fois le retrait enregistré (RDC-REF-007).
   */
  retirerImage(imageId: ImageMagasinId, maintenant: Date): ImageMagasin {
    this.verifierModifiable();
    const image = this.imagesActuelles.find((candidate) =>
      candidate.id.equals(imageId),
    );
    if (image === undefined) {
      throw new MagasinImageIntrouvable(imageId);
    }

    this.imagesActuelles = this.imagesActuelles.filter(
      (candidate) => candidate !== image,
    );
    this.derniereModification = maintenant;
    return image;
  }

  /** Après la plus grande position : un retrait ne crée pas de doublon d'ordre. */
  private ordreSuivant(): number {
    return this.imagesActuelles.reduce(
      (suivant, image) => Math.max(suivant, image.ordre + 1),
      0,
    );
  }

  private verifierModifiable(): void {
    if (this.statutActuel === StatutMagasin.ARCHIVE) {
      throw new MagasinArchive(this.id);
    }
  }
}

/** Ordre d'affichage : position, puis date d'ajout et identité pour départager. */
function trierParOrdre(images: readonly ImageMagasin[]): ImageMagasin[] {
  return [...images].sort(
    (a, b) =>
      a.ordre - b.ordre ||
      a.ajouteeLe.getTime() - b.ajouteeLe.getTime() ||
      a.id.valeur.localeCompare(b.id.valeur),
  );
}
